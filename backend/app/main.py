from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import list_interactions, save_interaction, upsert_memory
from app.models.schemas import (
    PipelineResponse,
    ProcessRequest,
    SaveMemoryRequest,
    SaveMemoryResponse,
    STTTranslateResponse,
)
from app.services.pipeline import PipelineContext, run_pipeline
from app.services.stt import sarvam_translate_audio

app = FastAPI(title="Deterministic Prompt Optimization Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/stt/translate", response_model=STTTranslateResponse)
async def translate_audio(file: UploadFile = File(...)):
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty audio file")

    try:
        result = sarvam_translate_audio(raw, file.filename or "audio.wav")
        if not result["text"].strip():
            raise HTTPException(status_code=422, detail="No transcript produced from audio")
        return STTTranslateResponse(**result)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"STT failure: {exc}") from exc


@app.post("/api/process", response_model=PipelineResponse)
def process_text(payload: ProcessRequest):
    try:
        response = run_pipeline(
            PipelineContext(
                raw_input=payload.raw_input,
                stt_source=payload.stt_source,
                confidence=payload.confidence,
                mode=payload.mode,
            )
        )

        save_interaction(
            raw_input=response.raw_input,
            normalized_text=response.normalized_text,
            intent=response.intent.model_dump(),
            final_prompt=response.optimized_prompt,
        )

        return response
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline failure: {exc}") from exc


@app.post("/api/memory/save", response_model=SaveMemoryResponse)
def save_memory(payload: SaveMemoryRequest):
    upsert_memory(payload.task, payload.domain)
    return SaveMemoryResponse(saved=True, message="Memory saved")


@app.get("/api/interactions")
def get_interactions(limit: int = 50):
    records = list_interactions(limit=limit)
    for record in records:
        try:
            record["intent"] = json.loads(record["intent"])
        except Exception:
            pass
    return {"items": records}
