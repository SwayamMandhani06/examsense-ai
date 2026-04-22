import hashlib
import json
import logging
import os
import re
from typing import Any

from dotenv import load_dotenv

from app.ai.llm import call_openrouter

load_dotenv()
logger = logging.getLogger(__name__)

DEFAULT_ANALYTICS_MODEL = os.getenv("OPENROUTER_ANALYTICS_MODEL", os.getenv("OPENROUTER_MODEL", "anthropic/claude-opus-4.1"))

_FOOTER_PATTERNS = [
    re.compile(r"CEGP\d+\s+\d{1,3}(?:\.\d{1,3}){3}\s+\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}\s+static-\d+", re.IGNORECASE),
    re.compile(r"SEAT\s*No\.\s*:\s*", re.IGNORECASE),
    re.compile(r"\bP\s*\.\s*T\s*\.\s*O\.?\b", re.IGNORECASE),
    re.compile(r"♦+", re.IGNORECASE),
]

_TOPIC_RULES = [
    (("loader", "linker", "linking", "dll", "loading scheme", "compile and go"), "Loaders and Linking", 1),
    (("process", "thread", "pcb", "scheduling", "round robin", "preemptive", "non-preemptive"), "Process and Scheduling", 2),
    (("semaphore", "mutex", "monitor", "deadlock", "critical section", "reader writer"), "Synchronization and Deadlocks", 3),
    (("paging", "segmentation", "tlb", "memory partition", "page replacement"), "Memory Management", 4),
    (("file system", "disk scheduling", "inode", "protection"), "File Systems and Protection", 5),
]

_HARD_HINTS = (
    "algorithm",
    "count page faults",
    "given a memory partition",
    "how would each",
    "consider page sequences",
    "write solution",
    "derive",
    "design",
    "analyze",
    "compare",
)
_MEDIUM_HINTS = (
    "differentiate",
    "explain",
    "discuss",
    "describe",
    "what is",
    "write a short note",
    "list and explain",
)


def build_question_key(question_text: str) -> str:
    normalized = question_text.lower()
    normalized = re.sub(r"\bq\s*\d+\b", " ", normalized)
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return hashlib.sha1(normalized.encode("utf-8")).hexdigest()


def _clean_pdf_text(text: str) -> str:
    cleaned = text.replace("\r", "\n")
    for pattern in _FOOTER_PATTERNS:
        cleaned = pattern.sub(" ", cleaned)
    cleaned = re.sub(r"\s*\n\s*", "\n", cleaned)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    return cleaned.strip()


def _extract_question_blocks(cleaned_text: str) -> list[dict[str, Any]]:
    condensed = re.sub(r"\s+", " ", cleaned_text).strip()
    marker_pattern = re.compile(r"(?i)\b(?:OR\s+)?Q\s*([1-9]\d*)\s*[\)\.:-]")
    matches = list(marker_pattern.finditer(condensed))

    by_number: dict[int, str] = {}
    for idx, match in enumerate(matches):
        question_number = int(match.group(1))
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(condensed)
        block = condensed[start:end].strip(" :-")
        block = re.sub(r"\bOR\s*$", "", block, flags=re.IGNORECASE).strip()
        if len(block) < 12:
            continue

        question_text = f"Q{question_number}) {block}"
        previous = by_number.get(question_number)
        if not previous or len(question_text) > len(previous):
            by_number[question_number] = question_text

    # Fallback for papers that use plain numeric markers (1), 2., Question 3:)
    if not by_number:
        line_marker_pattern = re.compile(r"(?mi)^\s*(?:question\s*)?([1-9]\d?)\s*[\)\.:-]\s+")
        line_matches = list(line_marker_pattern.finditer(cleaned_text))
        for idx, match in enumerate(line_matches):
            question_number = int(match.group(1))
            start = match.end()
            end = line_matches[idx + 1].start() if idx + 1 < len(line_matches) else len(cleaned_text)
            block = cleaned_text[start:end].strip(" :-\n\t")
            block = re.sub(r"\bOR\s*$", "", block, flags=re.IGNORECASE).strip()
            block = re.sub(r"\s+", " ", block).strip()
            if len(block) < 16:
                continue

            question_text = f"Q{question_number}) {block}"
            previous = by_number.get(question_number)
            if not previous or len(question_text) > len(previous):
                by_number[question_number] = question_text

    return [{"question_number": qn, "question": qt} for qn, qt in sorted(by_number.items(), key=lambda x: x[0])]


def _heuristic_topic_unit(question: str) -> tuple[str, int]:
    low = question.lower()
    for keywords, topic, unit in _TOPIC_RULES:
        if any(keyword in low for keyword in keywords):
            return topic, unit
    return "General", 1


def _heuristic_difficulty(question: str) -> str:
    low = question.lower()
    if any(hint in low for hint in _HARD_HINTS):
        return "hard"
    if any(hint in low for hint in _MEDIUM_HINTS):
        return "medium"
    return "easy"


def _parse_classifier_response(raw: str) -> dict[int, dict[str, Any]]:
    cleaned = raw.strip()
    cleaned = re.sub(r"^```json\s*|^```\s*|\s*```$", "", cleaned, flags=re.IGNORECASE)
    payload = json.loads(cleaned)
    if not isinstance(payload, list):
        return {}

    result: dict[int, dict[str, Any]] = {}
    for item in payload:
        if not isinstance(item, dict):
            continue
        qn = item.get("question_number")
        if qn is None:
            continue
        try:
            qn_int = int(qn)
        except (ValueError, TypeError):
            continue
        difficulty = str(item.get("difficulty", "medium")).strip().lower()
        if difficulty not in {"easy", "medium", "hard"}:
            difficulty = "medium"
        unit = item.get("unit", 1)
        try:
            unit = int(unit)
        except (ValueError, TypeError):
            unit = 1
        if unit < 1:
            unit = 1
        result[qn_int] = {
            "topic": str(item.get("topic", "General")).strip() or "General",
            "unit": unit,
            "difficulty": difficulty,
        }
    return result


def _classify_questions_with_ai(questions: list[dict[str, Any]], subject_name: str) -> dict[int, dict[str, Any]]:
    if not questions:
        return {}

    prompt_questions = []
    for q in questions:
        prompt_questions.append({"question_number": q["question_number"], "question": q["question"][:900]})

    prompt = (
        f"You are an exam-analytics classifier for subject '{subject_name}'.\n"
        "Classify each question below into topic, unit (1-5), and difficulty.\n"
        "Return ONLY JSON array with objects:\n"
        '{"question_number": number, "topic": string, "unit": 1-5, "difficulty": "easy|medium|hard"}\n\n'
        f"Questions:\n{json.dumps(prompt_questions, ensure_ascii=False)}"
    )

    messages = [
        {
            "role": "system",
            "content": (
                "You output strict JSON only. "
                "Be precise and academically consistent."
            ),
        },
        {"role": "user", "content": prompt},
    ]

    try:
        raw = call_openrouter(
            messages,
            preferred_models=[DEFAULT_ANALYTICS_MODEL],
            temperature=0.0,
            max_tokens=1200,
            timeout=75,
        )
        parsed = _parse_classifier_response(raw)
        return parsed
    except Exception as exc:
        logger.warning("AI classification failed, using heuristics: %s", exc)
        return {}


def _regex_extract(text: str, exam_year: int) -> list[dict]:
    cleaned = _clean_pdf_text(text)
    blocks = _extract_question_blocks(cleaned)
    if not blocks:
        logger.warning("Regex fallback could not find question blocks.")
        return []

    output = []
    for block in blocks:
        question = block["question"].strip()
        topic, unit = _heuristic_topic_unit(question)
        difficulty = _heuristic_difficulty(question)
        output.append(
            {
                "question_number": block["question_number"],
                "question": question,
                "topic": topic,
                "unit": unit,
                "difficulty": difficulty,
                "exam_year": int(exam_year),
                "question_key": build_question_key(question),
            }
        )

    logger.info("Regex extraction produced %d question blocks.", len(output))
    return output


def extract_questions_with_ai(text: str, subject_name: str, exam_year: int) -> list[dict]:
    cleaned = _clean_pdf_text(text)
    blocks = _extract_question_blocks(cleaned)
    if not blocks:
        return _regex_extract(text, exam_year)

    ai_classifications = _classify_questions_with_ai(blocks, subject_name)
    questions = []

    for block in blocks:
        question_number = int(block["question_number"])
        question_text = block["question"].strip()
        ai_result = ai_classifications.get(question_number, {})

        if ai_result:
            topic = ai_result["topic"]
            unit = ai_result["unit"]
            difficulty = ai_result["difficulty"]
        else:
            topic, unit = _heuristic_topic_unit(question_text)
            difficulty = _heuristic_difficulty(question_text)

        questions.append(
            {
                "question_number": question_number,
                "question": question_text,
                "topic": topic,
                "unit": unit,
                "difficulty": difficulty,
                "exam_year": int(exam_year),
                "question_key": build_question_key(question_text),
            }
        )

    logger.info("Question extraction produced %d question blocks.", len(questions))
    return questions


def analyze_all_materials(materials: list[dict], subject_name: str) -> dict | None:
    del materials
    del subject_name
    # Legacy helper kept for compatibility.
    return None
