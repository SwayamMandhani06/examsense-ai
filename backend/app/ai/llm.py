import logging
import os
from typing import Iterable, Optional

import requests
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "gemma2-9b-it",
]


def _dedupe_models(models: Iterable[str]) -> list[str]:
    deduped: list[str] = []
    for model in models:
        cleaned = str(model or "").strip()
        if cleaned and cleaned not in deduped:
            deduped.append(cleaned)
    return deduped


def _extract_content(payload: dict) -> str:
    choices = payload.get("choices")
    if not choices or not isinstance(choices, list):
        raise ValueError("Invalid choices in Groq response")
    message = choices[0].get("message", {})
    content = message.get("content", "")
    if isinstance(content, list):
        parts = [str(part.get("text", "")) for part in content if isinstance(part, dict)]
        content = "\n".join([p for p in parts if p]).strip()
    return str(content).strip()


def call_groq(
    messages: list[dict],
    *,
    preferred_models: Optional[list[str]] = None,
    temperature: float = 0.2,
    max_tokens: int = 1400,
    timeout: int = 45,
) -> str:
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENROUTER_API_KEY")
    if not api_key or api_key.startswith("your_"):
        logger.error("GROQ_API_KEY is not configured in backend environment.")
        raise RuntimeError("GROQ_API_KEY is missing. Please add your Groq API key in Render / .env.")

    api_key = api_key.strip()
    candidate_models = _dedupe_models((preferred_models or []) + [DEFAULT_MODEL] + FALLBACK_MODELS)
    last_error = "Groq API request failed."

    for model in candidate_models:
        try:
            logger.info("Querying Groq with model: %s", model)
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
            last_error = f"Network connection to Groq failed: {exc}"
            logger.warning("Network failure for model %s: %s", model, exc)
            continue

        if response.status_code == 401:
            logger.error("Groq 401 Unauthorized: Invalid GROQ_API_KEY provided.")
            raise RuntimeError("Invalid GROQ_API_KEY. Please verify your API key in Render / backend environment.")

        if response.status_code == 429:
            last_error = "Groq rate limit exceeded."
            logger.warning("Groq rate limit on model %s", model)
            continue

        if response.status_code != 200:
            logger.warning("Groq model %s returned status %d: %s", model, response.status_code, response.text[:200])
            last_error = f"Groq API error ({response.status_code}): {response.text[:120]}"
            continue

        try:
            payload = response.json()
            content = _extract_content(payload)
            if content:
                return content
            last_error = "Empty response returned from model."
        except Exception as exc:
            last_error = f"Failed to parse Groq response: {exc}"
            logger.warning("Response parsing failed for model %s: %s", model, exc)
            continue

    raise RuntimeError(last_error)


# Aliases for backward compatibility
call_openrouter = call_groq
call_llm = call_groq


def generate_answer(
    question: str,
    context_list: Optional[list[str]] = None,
    chat_history: Optional[list[dict]] = None,
    *,
    require_context: bool = False,
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

    has_context = bool(context_text)

    if has_context:
        system_prompt = """You are ExamSense AI, a high-precision academic exam tutor.
Answer the student's question clearly, thoroughly, and concisely based primarily on the provided study-material context.
Rules:
1. Provide structured, exam-ready answers with bullet points, numbered steps, or formulas where applicable.
2. Quote or reference specific evidence as [Source 1], [Source 2], etc. when citing provided context.
3. Make explanations easy to understand for semester exam preparation."""
        user_prompt = (
            f"Study Material Context:\n{context_text}\n\n"
            f"Student Question:\n{question}\n\n"
            "Provide a comprehensive, well-structured answer with source citations."
        )
    else:
        system_prompt = """You are ExamSense AI, an intelligent university academic tutor.
Answer the student's academic question thoroughly with clear structure, key definitions, derivations, diagrams (ASCII/text), or step-by-step points suitable for B.Tech semester exams."""
        user_prompt = (
            f"Student Question: {question}\n\n"
            "Provide a comprehensive, high-scoring exam-ready explanation with key points and structured clarity."
        )

    messages: list[dict] = [{"role": "system", "content": system_prompt}]

    for msg in chat_history[-8:]:
        role = msg.get("role")
        content = str(msg.get("content", "")).strip()
        if role in {"user", "assistant"} and content and content != "__typing__":
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_prompt})

    try:
        return call_groq(messages, temperature=0.2, max_tokens=1400)
    except RuntimeError as exc:
        msg = str(exc)
        logger.error("generate_answer error: %s", msg)
        if "missing" in msg.lower() or "not configured" in msg.lower():
            return "⚠️ AI Engine is not configured yet. Please set `GROQ_API_KEY` in your Render Environment variables."
        if "invalid" in msg.lower() and "api" in msg.lower():
            return "⚠️ The provided `GROQ_API_KEY` is invalid or expired. Please check and update it in your Render settings."
        if "rate limit" in msg.lower():
            return "⚠️ AI provider rate limit reached. Please wait 10 seconds and retry."
        return f"Unable to reach AI service: {msg}"
