import logging
import os
import time
from typing import Iterable, Optional

import requests
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

_cached_models: list[str] = []
_cache_timestamp: float = 0


def _detect_provider(api_key: str) -> tuple[str, str, str, list[str]]:
    """
    Detect provider, base URL, chat completions URL, and default fallback models based on the API key format.
    Returns: (provider_name, base_url, completions_url, default_models)
    """
    key = api_key.strip()
    # Explicit override via env if set
    custom_base = os.getenv("LLM_BASE_URL") or os.getenv("OPENAI_BASE_URL")
    if custom_base:
        base = custom_base.rstrip("/")
        return (
            "custom",
            base,
            f"{base}/chat/completions",
            ["llama-3.3-70b-versatile", "meta-llama/llama-3.3-70b-instruct", "gpt-4o-mini"],
        )

    # OpenRouter key detection
    if key.startswith("sk-or-") or os.getenv("OPENROUTER_API_KEY"):
        return (
            "OpenRouter",
            "https://openrouter.ai/api/v1",
            "https://openrouter.ai/api/v1/chat/completions",
            [
                "meta-llama/llama-3.3-70b-instruct",
                "meta-llama/llama-3.1-8b-instruct:free",
                "google/gemini-2.0-flash-exp:free",
                "deepseek/deepseek-chat",
                "openrouter/auto",
            ],
        )

    # Groq key (default or gsk_ prefix)
    return (
        "Groq",
        "https://api.groq.com/openai/v1",
        "https://api.groq.com/openai/v1/chat/completions",
        [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "deepseek-r1-distill-llama-70b",
            "llama-3.2-3b-preview",
            "llama-3.2-1b-preview",
            "qwen-2.5-32b",
        ],
    )


def _fetch_live_models(base_url: str, api_key: str) -> list[str]:
    """Dynamically query the provider's /models endpoint to retrieve active models for this key."""
    global _cached_models, _cache_timestamp
    now = time.time()
    if _cached_models and (now - _cache_timestamp) < 600:
        return _cached_models

    try:
        res = requests.get(
            f"{base_url}/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=8,
        )
        if res.status_code == 200:
            data = res.json()
            models_data = data.get("data", [])
            valid_models = []
            for item in models_data:
                model_id = str(item.get("id", "")).strip()
                if not model_id:
                    continue
                # Filter out non-text generation models
                if any(x in model_id.lower() for x in ["whisper", "guard", "moderation", "tts", "embedding", "embed", "vision", "image"]):
                    continue
                valid_models.append(model_id)

            if valid_models:
                _cached_models = valid_models
                _cache_timestamp = now
                logger.info("Dynamically retrieved %d active models from %s", len(valid_models), base_url)
                return valid_models
    except Exception as exc:
        logger.warning("Failed to dynamically fetch live models from %s: %s", base_url, exc)

    return []


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
        raise ValueError("Invalid choices in LLM response")
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
    api_key = (
        os.getenv("GROQ_API_KEY")
        or os.getenv("OPENROUTER_API_KEY")
        or os.getenv("OPENAI_API_KEY")
    )
    if not api_key or api_key.startswith("your_"):
        logger.error("No valid API key configured in backend environment.")
        raise RuntimeError("AI API key is missing. Please set GROQ_API_KEY in your Render / .env environment.")

    api_key = api_key.strip()
    provider_name, base_url, completions_url, default_fallbacks = _detect_provider(api_key)

    # 1. Fetch live models from provider
    live_models = _fetch_live_models(base_url, api_key)

    env_model = os.getenv("GROQ_MODEL") or os.getenv("OPENROUTER_MODEL") or os.getenv("LLM_MODEL")

    candidate_models = _dedupe_models(
        (preferred_models or [])
        + ([env_model] if env_model else [])
        + live_models
        + default_fallbacks
    )
    attempt_errors: list[str] = []

    for model in candidate_models:
        try:
            logger.info("Calling %s with model: %s", provider_name, model)
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            if provider_name == "OpenRouter":
                headers["HTTP-Referer"] = "https://examsense-ai.vercel.app"
                headers["X-Title"] = "ExamSense AI"

            response = requests.post(
                completions_url,
                headers=headers,
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=timeout,
            )
        except requests.RequestException as exc:
            err = f"Network failure: {exc}"
            logger.warning("%s network failure for model %s: %s", provider_name, model, exc)
            attempt_errors.append(f"{model}: {err}")
            continue

        if response.status_code == 401:
            logger.error("%s 401 Unauthorized: Invalid API key.", provider_name)
            raise RuntimeError(f"Invalid {provider_name} API Key. Please verify your API key in Render environment settings.")

        if response.status_code != 200:
            err_detail = response.text[:140]
            try:
                err_json = response.json()
                if "error" in err_json and "message" in err_json["error"]:
                    err_detail = err_json["error"]["message"]
            except Exception:
                pass
            logger.warning("%s model %s returned status %d: %s", provider_name, model, response.status_code, err_detail)
            attempt_errors.append(f"{model} ({response.status_code}): {err_detail}")
            continue

        try:
            payload = response.json()
            content = _extract_content(payload)
            if content:
                return content
            attempt_errors.append(f"{model}: Empty content returned")
        except Exception as exc:
            logger.warning("Response parsing failed for model %s: %s", model, exc)
            attempt_errors.append(f"{model}: Parse error ({exc})")
            continue

    raise RuntimeError(" | ".join(attempt_errors) if attempt_errors else f"All {provider_name} model attempts failed.")


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
