from __future__ import annotations

import json
import logging
import re
from typing import Any

from langdetect import detect

from app.config import settings
from app.models.schemas import IntentPayload

logger = logging.getLogger(__name__)

# ─── Model Fallback Chain ───
GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-001"]

# ─── Hinglish → English Phrase Patterns (order matters: longer patterns first) ───
HINGLISH_PHRASES: list[tuple[str, str]] = [
    # Specific multi-word patterns (longest first)
    (r"\binvest karne hain\b", "I need to invest"),
    (r"\binvest karna hai\b", "I need to invest"),
    (r"\binvest karna chahta hun\b", "I want to invest"),
    (r"\bgym app ke liye\b", "for a gym app"),
    (r"\bplan bana\b", "create a plan"),
    # Verb phrases
    (r"\bkaise kar sakta hun\b", "how can I do this"),
    (r"\bkaise kar sakti hun\b", "how can I do this"),
    (r"\bkaise karu\b", "how do I do"),
    (r"\bkaise kar sakte hain\b", "how can this be done"),
    (r"\bkaise\b", "how"),
    (r"\bkar sakta hun\b", "I can do"),
    (r"\bkar sakta\b", "can do"),
    (r"\bkarna hai\b", "need to do"),
    (r"\bkarne hain\b", "need to do"),
    (r"\bkarna chahta hun\b", "I want to"),
    (r"\bkarna chahiye\b", "should do"),
    (r"\bbana do\b", "create"),
    (r"\bbanao\b", "create"),
    (r"\bbana\b", "create"),
    (r"\bbatao\b", "explain"),
    (r"\bbataye\b", "explain"),
    # Pronoun/possessive
    (r"\bmeri salary\b", "my salary is"),
    (r"\bmera\b", "my"),
    (r"\bmeri\b", "my"),
    (r"\bmere\b", "my"),
    (r"\bmain\b", "I"),
    # Time
    (r"\bek mahine mein\b", "in one month"),
    (r"\bmahine mein\b", "in a month"),
    (r"\bmahina\b", "month"),
    (r"\bmahine\b", "monthly"),
    (r"\bsaal mein\b", "in a year"),
    (r"\bhafta\b", "week"),
    (r"\broz\b", "daily"),
    # Finance
    (r"\binvest karne\b", "to invest"),
    (r"\binvest karna\b", "to invest"),
    (r"\bpaisa\b", "money"),
    (r"\bpaise\b", "money"),
    # Other
    (r"\bmein\b", "in"),
    (r"\bke liye\b", "for"),
    (r"\bse\b", "from"),
    (r"\bko\b", "to"),
    (r"\baur\b", "and"),
    (r"\bya\b", "or"),
    (r"\blekin\b", "but"),
    (r"\bzyada\b", "more"),
    (r"\bkam\b", "less"),
    (r"\baccha\b", "good"),
]


INTENT_PROMPT = """You are a multilingual intent extraction engine.

The user input may be in Hindi, Hinglish (Hindi+English mix), or English.

Your job:
1. TRANSLATE the input to clean, fluent English first
2. Understand what the user actually wants
3. Extract structured intent

CRITICAL RULES:
- The "task" field MUST be a clean, concise English description of what the user wants. 
  NEVER copy Hinglish or Hindi text into the task field.
- If the input says "10k invest karne hain", the task should be "invest 10,000" not the raw Hinglish.
- Preserve important numbers, amounts, and specific details.
- The "domain" should be a single lowercase word (finance, marketing, fitness, software, education, general, etc.)
- The "constraints" should capture any specific requirements mentioned.

Return STRICT JSON only with these exact keys:
{{
  "intent": "question" or "instruction" or "request",
  "task": "<clean English description of what user wants>",
  "domain": "<single word domain>",
  "constraints": ["<specific requirement 1>", "<specific requirement 2>"],
  "output_format": "paragraph" or "bullet list" or "step-by-step" or "table" or "json",
  "audience": "<target audience>"
}}

User input:
{text}
"""


def _translate_hinglish(text: str) -> str:
    """Phrase-level Hinglish → English translation for fallback mode."""
    result = text
    for pattern, replacement in HINGLISH_PHRASES:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    # Clean up extra spaces
    result = re.sub(r"\s+", " ", result).strip()
    return result


def _fallback_intent(text: str) -> IntentPayload:
    """Deterministic intent extraction without AI. Includes basic Hinglish translation."""
    # First translate Hinglish words to English
    translated = _translate_hinglish(text)

    lower = translated.lower()
    domain = "general"
    domain_keywords = {
        "marketing": ["marketing", "advertis", "campaign", "brand", "promote"],
        "finance": ["invest", "salary", "money", "budget", "loan", "bank", "saving", "stock", "mutual fund", "income", "10k", "lakh"],
        "fitness": ["fitness", "gym", "workout", "exercise", "diet", "health"],
        "software": ["app", "software", "code", "program", "website", "develop"],
        "education": ["study", "learn", "course", "exam", "school", "college"],
    }
    for d, keywords in domain_keywords.items():
        if any(kw in lower for kw in keywords):
            domain = d
            break

    output_format = "paragraph"
    if "bullet" in lower or "points" in lower or "list" in lower:
        output_format = "bullet list"
    elif "json" in lower:
        output_format = "json"
    elif "table" in lower:
        output_format = "table"
    elif "step" in lower:
        output_format = "step-by-step"

    # Determine intent type
    intent_type = "instruction"
    if any(q in lower for q in ["how", "what", "when", "where", "who", "can", "kaise", "kya"]):
        intent_type = "question"

    task = translated.strip()[:200]
    if not task:
        task = "Summarize user request"

    return IntentPayload(
        intent=intent_type,
        task=task,
        domain=domain,
        constraints=[],
        output_format=output_format,
        audience="general audience",
    )


def detect_language(text: str) -> str:
    try:
        lang = detect(text)
        # langdetect misidentifies Hinglish — override common misdetections
        hinglish_words = {"kaise", "karne", "hain", "mein", "bhai", "hai", "karo", "salary", "invest"}
        words_lower = {w.lower() for w in text.split()}
        if words_lower & hinglish_words:
            return "hi-en"  # Hinglish
        return lang
    except Exception:
        return "unknown"


def _is_quota_or_rate_limited(exc: Exception) -> bool:
    msg = str(exc).lower()
    indicators = (
        "429",
        "quota",
        "rate limit",
        "resource_exhausted",
        "too many requests",
        "exceeded",
    )
    return any(token in msg for token in indicators)


def _call_gemini(model_name: str, text: str, api_key: str) -> tuple[IntentPayload, float]:
    """Call a specific Gemini model. Raises on failure."""
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    prompt = INTENT_PROMPT.format(text=text)

    response = model.generate_content(
        prompt,
        generation_config={"temperature": 0, "top_p": 1, "response_mime_type": "application/json"},
    )
    payload: dict[str, Any] = json.loads(response.text)

    # Ensure constraints is always a list
    if not isinstance(payload.get("constraints"), list):
        payload["constraints"] = []

    parsed = IntentPayload(**payload)
    return parsed, 0.9


def extract_intent(text: str) -> tuple[IntentPayload, float]:
    keys = settings.gemini_keys
    if not keys:
        return _fallback_intent(text), 0.65

    # Try each key, and for each key try the model fallback chain.
    for key_index, api_key in enumerate(keys, start=1):
        for model_name in GEMINI_MODELS:
            try:
                result = _call_gemini(model_name, text, api_key)
                logger.info("Intent extracted with model: %s (key #%s)", model_name, key_index)
                return result
            except Exception as exc:
                logger.warning("Model %s failed on key #%s: %s", model_name, key_index, str(exc)[:120])
                if _is_quota_or_rate_limited(exc):
                    logger.warning("Quota/rate limit hit on key #%s, switching Gemini key", key_index)
                    break
                continue

    # All key/model attempts failed — use smart fallback with translation
    logger.warning("All Gemini keys/models failed, using deterministic fallback with Hinglish translation")
    return _fallback_intent(text), 0.65
