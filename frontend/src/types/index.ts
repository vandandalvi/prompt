export type OptimizationMode = 'balanced' | 'aggressive' | 'strict';

export interface IntentPayload {
  intent: string;
  task: string;
  domain: string;
  constraints: string[];
  output_format: string;
  audience: string;
}

export interface PipelineResponse {
  raw_input: string;
  normalized_text: string;
  cleaned_text: string;
  intent: IntentPayload;
  confirmation_message: string;
  optimized_prompt: string;
  mode: OptimizationMode;
  token_stats: {
    raw_tokens: number;
    optimized_tokens: number;
    reduction_percent: number;
  };
  what_changed: {
    removed_words: string[];
    replaced_words: Record<string, string>;
    structured_output: Record<string, string>;
  };
  decision_logs: string[];
  language_detected: string;
  stt_source: string;
  confidence: number;
}

export interface MemoryEntry {
  id: string;
  task: string;
  domain: string;
  format: string;
  timestamp: string;
}
