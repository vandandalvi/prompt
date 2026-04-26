from app.services.cleaning import clean_text, is_noise
from app.services.optimizer import build_structured_prompt
from app.models.schemas import IntentPayload


def test_cleaning_removes_fillers_and_symbols():
    result = clean_text("um build a marketing plan & budget")
    assert "um" in [w.lower() for w in result.removed_words]
    assert result.replaced_words["&"] == "and"
    assert "and" in result.cleaned_text


def test_noise_detection():
    assert is_noise("!!!") is True
    assert is_noise("build gym app") is False


def test_optimizer_strict_mode():
    intent = IntentPayload(
        intent="instruction",
        task="build gym app plan",
        domain="fitness",
        constraints=["under 200 words"],
        output_format="bullet list",
        audience="founders",
    )
    prompt = build_structured_prompt(intent, "build gym app plan", "strict")
    assert "task:build gym app plan" in prompt
    assert "format:bullet list" in prompt
