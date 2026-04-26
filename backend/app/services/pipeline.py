from __future__ import annotations

from dataclasses import asdict, dataclass

from app.models.schemas import IntentPayload, OptimizationMode, PipelineResponse
from app.services.cleaning import clean_text, is_noise
from app.services.intent import detect_language, extract_intent
from app.services.optimizer import build_structured_prompt
from app.services.tokenizer import token_reduction


@dataclass
class PipelineContext:
    raw_input: str
    stt_source: str
    confidence: float
    mode: OptimizationMode


def run_pipeline(ctx: PipelineContext) -> PipelineResponse:
    logs: list[str] = [
        f"STT source used: {ctx.stt_source}",
        f"Incoming confidence: {ctx.confidence}",
    ]

    if is_noise(ctx.raw_input):
        raise ValueError("Noise input detected. Please retry with clearer input.")

    language = detect_language(ctx.raw_input)
    logs.append(f"Language detected: {language}")

    normalized_text = " ".join(ctx.raw_input.split())

    cleaning = clean_text(normalized_text)
    logs.append(f"Words removed: {len(cleaning.removed_words)}")

    if not cleaning.cleaned_text:
        raise ValueError("Input became empty after cleaning.")

    intent, intent_confidence = extract_intent(cleaning.cleaned_text)
    logs.append(f"Intent confidence: {intent_confidence}")

    if not intent.task.strip():
        raise ValueError("No intent/task could be extracted.")

    confirmation = f"You want {intent.task} with {intent.output_format}. Confirm?"
    optimized = build_structured_prompt(intent, cleaning.cleaned_text, ctx.mode)

    stats = token_reduction(ctx.raw_input, optimized)
    logs.append(f"Token reduction: {stats['reduction_percent']}%")

    what_changed = {
        "removed_words": cleaning.removed_words,
        "replaced_words": cleaning.replaced_words,
        "structured_output": {
            "intent": intent.intent,
            "task": intent.task,
            "domain": intent.domain,
            "output_format": intent.output_format,
            "audience": intent.audience,
        },
    }

    return PipelineResponse(
        raw_input=ctx.raw_input,
        normalized_text=normalized_text,
        cleaned_text=cleaning.cleaned_text,
        intent=IntentPayload(**asdict(intent) if hasattr(intent, "__dataclass_fields__") else intent.model_dump()),
        confirmation_message=confirmation,
        optimized_prompt=optimized,
        mode=ctx.mode,
        token_stats=stats,
        what_changed=what_changed,
        decision_logs=logs,
        language_detected=language,
        stt_source=ctx.stt_source,
        confidence=ctx.confidence,
    )
