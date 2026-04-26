import type { OptimizationMode, PipelineResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

export async function processInput(payload: {
  raw_input: string;
  mode: OptimizationMode;
  confidence: number;
  stt_source: 'browser' | 'sarvam' | 'text';
  force_high_accuracy: boolean;
}): Promise<PipelineResponse> {
  const res = await fetch(`${API_BASE}/api/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail ?? 'Failed to process input');
  }

  return res.json() as Promise<PipelineResponse>;
}

export async function sarvamTranslate(file: Blob): Promise<{
  text: string;
  language: string;
  confidence: number;
  source: 'sarvam';
}> {
  const formData = new FormData();
  formData.append('file', file, 'audio.webm');

  const res = await fetch(`${API_BASE}/api/stt/translate`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail ?? 'High accuracy STT failed');
  }

  return res.json();
}

export async function saveMemory(task: string, domain: string, format: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/memory/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, domain, format }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail ?? 'Failed to save memory');
  }
}

export async function getInteractions(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/interactions`);
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return data.items ?? [];
}
