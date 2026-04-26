from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field


OptimizationMode = Literal["balanced", "aggressive", "strict"]


class STTTranslateResponse(BaseModel):
    text: str
    language: str
    confidence: float
    source: Literal["browser", "sarvam"]


class ProcessRequest(BaseModel):
    raw_input: str = Field(min_length=1)
    mode: OptimizationMode = "balanced"
    confidence: float = 1.0
    stt_source: Literal["browser", "sarvam", "text"] = "text"
    force_high_accuracy: bool = False


class IntentPayload(BaseModel):
    intent: str
    task: str
    domain: str
    constraints: list[str]
    output_format: str
    audience: str


class PipelineResponse(BaseModel):
    raw_input: str
    normalized_text: str
    cleaned_text: str
    intent: IntentPayload
    confirmation_message: str
    optimized_prompt: str
    mode: OptimizationMode
    token_stats: dict[str, Any]
    what_changed: dict[str, Any]
    decision_logs: list[str]
    language_detected: str
    stt_source: str
    confidence: float


class SaveMemoryRequest(BaseModel):
    task: str
    domain: str
    format: str = "paragraph"


class SaveMemoryResponse(BaseModel):
    saved: bool
    message: str
