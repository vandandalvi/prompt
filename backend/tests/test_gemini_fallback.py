from app.config import Settings
from app.services.intent import _is_quota_or_rate_limited as intent_is_quota_limited
from app.services.optimizer import _is_quota_or_rate_limited as optimizer_is_quota_limited


def test_settings_parses_and_dedupes_gemini_keys():
    settings = Settings(
        gemini_api_key="key_primary",
        gemini_api_keys="key_primary,key_secondary, key_tertiary",
    )

    assert settings.gemini_keys == ["key_primary", "key_secondary", "key_tertiary"]


def test_quota_detection_helpers_match_quota_messages():
    err = Exception("429 RESOURCE_EXHAUSTED: quota exceeded")
    assert intent_is_quota_limited(err) is True
    assert optimizer_is_quota_limited(err) is True


def test_quota_detection_helpers_ignore_non_quota_messages():
    err = Exception("invalid json response format")
    assert intent_is_quota_limited(err) is False
    assert optimizer_is_quota_limited(err) is False
