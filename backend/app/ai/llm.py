import os
from typing import Iterable, Optional

import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
]


def _dedupe_models(models: Iterable[str]) -> list[str]:
    deduped: list[str] = []
    for model in models:
        cleaned = str(model or "").strip()
        if cleaned and cleaned not in deduped:
            deduped.append(cleaned)
    return deduped


def _extract_content(payload: dict) -> str:
    content = payload["choices"][0]["message"]["content"]
    if isinstance(content, list):
        parts = [str(part.get("text", "")) for part in content if isinstance(part, dict)]
        content = "\n".join([p for p in parts if p]).strip()
    return str(content).strip()


def call_groq(
    messages: list[dict],
    *,
    preferred_models: Optional[list[str]] = None,
    temperature: float = 0.2,
    max_tokens: int = 1200,
    timeout: int = 60,
) -> str:
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENROUTER_API_KEY")
    if not api_key or api_key.startswith("your_"):
        raise RuntimeError("AI is not configured. Please set GROQ_API_KEY in backend/.env.")

    candidate_models = _dedupe_models((preferred_models or []) + [DEFAULT_MODEL] + FALLBACK_MODELS)
    last_error = "Groq API request failed."

    for model in candidate_models:
        try:
            response = requests.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=timeout,
            )
        except requests.RequestException as exc:
            last_error = f"Unable to reach Groq: {exc}"
            continue

        if response.status_code == 401:
            raise RuntimeError("Groq API key is invalid. Update GROQ_API_KEY in backend/.env.")

        if response.status_code in {400, 404, 422}:
            last_error = f"Model '{model}' unavailable or invalid request."
            continue

        if response.status_code == 429:
            last_error = "Rate limit reached on Groq API."
            continue

        if response.status_code >= 500:
            last_error = f"Groq server error ({response.status_code})."
            continue

        response.raise_for_status()
        payload = response.json()
        try:
            content = _extract_content(payload)
        except (KeyError, IndexError, TypeError):
            last_error = "Unexpected response shape from Groq."
            continue

        if content:
            return content
        last_error = "Empty response from model."

    raise RuntimeError(last_error)


# Alias for backward compatibility
call_openrouter = call_groq
call_llm = call_groq


def generate_answer(
    question: str,
    context_list: Optional[list[str]] = None,
    chat_history: Optional[list[dict]] = None,
    *,
    require_context: bool = True,
) -> str:
    context_list = context_list or []
    chat_history = chat_history or []

    formatted_sources: list[str] = []
    for idx, chunk in enumerate(context_list, start=1):
        cleaned = str(chunk or "").strip()
        if not cleaned:
            continue
        if len(cleaned) > 2200:
            cleaned = cleaned[:2200].rstrip() + "..."
        formatted_sources.append(f"[Source {idx}]\n{cleaned}")
    context_text = "\n\n".join(formatted_sources).strip()

    if require_context and not context_text:
        return (
            "I couldn't find relevant evidence in your uploaded material for this question. "
            "Please ask about content that appears in the uploaded files or upload additional material."
        )

    system_prompt = """You are ExamSense AI, a strict retrieval-grounded academic assistant.

Rules:
1. Answer ONLY from the provided study-material context.
2. Do NOT use outside knowledge or speculation.
3. If context is insufficient, clearly say what is missing.
4. Provide high-quality, exam-ready explanations with concise structure.
5. Quote or reference key evidence snippets as [Source 1], [Source 2], etc.
6. If asked for steps/strategy, derive it strictly from the available context."""

    messages: list[dict] = [{"role": "system", "content": system_prompt}]

    for msg in chat_history[-8:]:
        role = msg.get("role")
        content = str(msg.get("content", "")).strip()
        if role in {"user", "assistant"} and content:
            messages.append({"role": role, "content": content})

    user_prompt = (
        f"Study Material Context:\n{context_text}\n\n"
        f"Student Question:\n{question}\n\n"
        "Answer using only the context above."
    )
    messages.append({"role": "user", "content": user_prompt})

    try:
        return call_groq(messages, temperature=0.15, max_tokens=1400)
    except RuntimeError as exc:
        msg = str(exc)
        if "invalid" in msg.lower() and "api key" in msg.lower():
            return "AI is not configured correctly. Please update GROQ_API_KEY."
        if "not configured" in msg.lower():
            return "AI is not configured. Please set your GROQ_API_KEY in backend/.env."
        if "rate limit" in msg.lower():
            return "Rate limited by AI provider. Please retry shortly."
        return "Unable to generate an answer right now. Please try again."
