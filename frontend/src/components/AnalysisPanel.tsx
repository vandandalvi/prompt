import type { PipelineResponse } from '../types';

interface AnalysisPanelProps {
  result: PipelineResponse | null;
  confidence: number;
  sttSource: string;
  mode: string;
  inputText: string;
  processing: boolean;
  error: string | null;
  confirmed: boolean;
  highAccuracy: boolean;
  onHighAccuracyChange: (val: boolean) => void;
  onRunPipeline: () => void;
  onConfirm: () => void;
  onRework: () => void;
}

export function AnalysisPanel({
  result,
  confidence,
  sttSource,
  mode,
  inputText,
  processing,
  error,
  confirmed,
  onRunPipeline,
  onConfirm,
  onRework,
}: AnalysisPanelProps) {
  return (
    <div className="glass-card animate-slide-up" id="analysis-panel" style={{ animationDelay: '0.1s' }}>
      <div className="panel-title">Analysis &amp; Confirmation</div>

      {/* Metadata badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="badge badge-cyan">
          🌍 {result?.language_detected ?? 'Awaiting input'}
        </span>
        <span className={`badge ${(result?.confidence ?? confidence) >= 0.8 ? 'badge-emerald' : 'badge-amber'}`}>
          📊 {((result?.confidence ?? confidence) * 100).toFixed(0)}%
        </span>
        <span className="badge badge-violet">
          📡 {result?.stt_source ?? sttSource}
        </span>
        <span className="badge">
          ⚡ {mode}
        </span>
      </div>

      {/* Run button */}
      <button
        id="btn-run-pipeline"
        onClick={onRunPipeline}
        disabled={processing || !inputText.trim()}
        className="btn-primary w-full"
      >
        {processing ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing Pipeline…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run Deterministic Pipeline
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="error-banner mt-4" id="error-display">
          <div className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Cleaned text */}
      {result && (
        <div className="mt-4 animate-fade-in">
          <div className="divider" />
          <p className="text-[10px] tracking-wider text-slate-500 uppercase mb-2">Cleaned Text</p>
          <div className="code-block text-emerald-700">{result.cleaned_text}</div>
        </div>
      )}

      {/* Intent JSON */}
      {result && (
        <div className="mt-4 animate-fade-in">
          <p className="text-[10px] tracking-wider text-slate-500 uppercase mb-2">Extracted Intent</p>
          <pre className="code-block text-sky-800">{JSON.stringify(result.intent, null, 2)}</pre>
        </div>
      )}

      {/* Confirmation */}
      {result && (
        <div className={`confirm-banner mt-4 animate-slide-up ${confirmed ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`} id="confirmation-section">
          <p className="text-sm text-amber-900 mb-3 font-medium">
            {confirmed ? '✅ Intent confirmed' : result.confirmation_message}
          </p>
          {!confirmed && (
            <div className="flex gap-3">
              <button id="btn-confirm" onClick={onConfirm} className="btn-success flex-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Confirm
              </button>
              <button id="btn-rework" onClick={onRework} className="btn-ghost flex-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rework
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
