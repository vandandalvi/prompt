from __future__ import annotations

import logging

from app.config import settings
from app.models.schemas import IntentPayload, OptimizationMode

logger = logging.getLogger(__name__)

# ─── Model Fallback Chain ───
GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-001"]

MODE_INSTRUCTIONS = {
    "balanced": (
        "Generate a clear, well-structured prompt that an LLM can directly execute. "
        "Include context, task, format requirements, and any constraints. "
        "Keep it readable but concise (3-6 sentences max)."
    ),
    "aggressive": (
        "Generate a minimal, compressed prompt using short sentences. "
        "Remove all unnecessary words. Maximum 2-3 sentences."
    ),
    "strict": (
        "Generate a keyword-only prompt using pipe-separated key:value pairs. "
        "Example format: task:create plan | domain:finance | format:bullet list "
        "No full sentences. Only structured keywords."
    ),
}


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


def _template_prompt(intent: IntentPayload, cleaned_text: str, mode: OptimizationMode) -> str:
    """Deterministic template-based prompt generation (no AI needed)."""
    if mode == "strict":
        keywords = [
            f"task:{intent.task}",
            f"domain:{intent.domain}",
            f"format:{intent.output_format}",
            f"audience:{intent.audience}",
        ]
        if intent.constraints:
            keywords.append("constraints:" + ",".join(intent.constraints))
        return " | ".join(keywords)

    if mode == "aggressive":
        constraint_line = ", ".join(intent.constraints) if intent.constraints else "none"
        return (
            f"{intent.task}. "
            f"Domain: {intent.domain}. "
            f"Format: {intent.output_format}. "
            f"Constraints: {constraint_line}."
        )

    # balanced
    constraints = "\n".join(f"- {item}" for item in intent.constraints) or "- None"
    return (
        f"You are a {intent.domain} domain expert.\n"
        f"Task: {intent.task}\n"
        f"Audience: {intent.audience}\n"
        f"Output format: {intent.output_format}\n"
        f"Constraints:\n{constraints}"
    )


def _call_gemini_optimize(
    model_name: str,
    intent: IntentPayload,
    cleaned_text: str,
    mode: OptimizationMode,
    api_key: str,
) -> str:
    """Call a specific Gemini model for prompt optimization. Raises on failure."""
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)

    instruction = MODE_INSTRUCTIONS.get(mode, MODE_INSTRUCTIONS["balanced"])

    prompt = f"""You are a prompt optimization engine. Your job is to convert structured intent 
into a clean, effective, English-only prompt that can be sent to an LLM.

MODE: {mode}
{instruction}

INTENT DATA:
- Task: {intent.task}
- Domain: {intent.domain}
- Output Format: {intent.output_format}
- Audience: {intent.audience}
- Constraints: {", ".join(intent.constraints) if intent.constraints else "none"}
- Original context: {cleaned_text}

RULES:
- Output MUST be entirely in English
- Output MUST be a usable prompt (not a meta-description)
- Do NOT include any explanation or preamble
- Do NOT wrap in quotes
- Preserve all specific numbers, amounts, and details from the original input
- Return ONLY the final prompt text, nothing else

Generate the optimized prompt:"""

    response = model.generate_content(
        prompt,
        generation_config={"temperature": 0, "top_p": 1},
    )

    result = response.text.strip()
    # Remove surrounding quotes if present
    if len(result) > 2 and result[0] in ('"', "'") and result[-1] == result[0]:
        result = result[1:-1]

    if not result:
        raise ValueError("Empty response from Gemini")

    return result


def build_structured_prompt(intent: IntentPayload, cleaned_text: str, mode: OptimizationMode) -> str:
    """Build optimized prompt. Uses Gemini if available, falls back to templates."""
    keys = settings.gemini_keys
    if not keys:
        return _template_prompt(intent, cleaned_text, mode)

    # Try each key, and for each key try the model fallback chain.
    for key_index, api_key in enumerate(keys, start=1):
        for model_name in GEMINI_MODELS:
            try:
                result = _call_gemini_optimize(model_name, intent, cleaned_text, mode, api_key)
                logger.info("Prompt optimized with model: %s (key #%s)", model_name, key_index)
                return result
            except Exception as exc:
                logger.warning("Optimizer model %s failed on key #%s: %s", model_name, key_index, str(exc)[:120])
                if _is_quota_or_rate_limited(exc):
                    logger.warning("Quota/rate limit hit on key #%s, switching Gemini key", key_index)
                    break
                continue

    # All models failed, use deterministic template
    logger.warning("All Gemini keys/models failed for optimization, using template")
    return _template_prompt(intent, cleaned_text, mode)
