from __future__ import annotations

import tempfile
from pathlib import Path

from app.config import settings


def sarvam_translate_audio(raw_bytes: bytes, filename: str = "audio.wav") -> dict:
    if not settings.sarvam_api_key:
        raise RuntimeError("SARVAM_API_KEY is not configured")

    from sarvamai import SarvamAI

    suffix = Path(filename).suffix or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp.write(raw_bytes)
        temp_path = Path(temp.name)

    try:
        client = SarvamAI(api_subscription_key=settings.sarvam_api_key)
        with temp_path.open("rb") as f:
            response = client.speech_to_text.translate(
                file=f,
                model="saaras:v3",
                mode="translate",
            )

        return {
            "text": getattr(response, "transcript", None) or getattr(response, "text", ""),
            "language": getattr(response, "language", "unknown"),
            "confidence": float(getattr(response, "confidence", 0.9)),
            "source": "sarvam",
        }
    finally:
        temp_path.unlink(missing_ok=True)
