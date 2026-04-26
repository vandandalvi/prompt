import type { PipelineResponse } from '../types';

interface ResultPanelProps {
  result: PipelineResponse | null;
  confirmed: boolean;
}

export function ResultPanel({ result, confirmed }: ResultPanelProps) {
  const promptText = confirmed
    ? result?.optimized_prompt ?? ''
    : '';

  function copyToClipboard() {
    if (promptText) {
      navigator.clipboard.writeText(promptText);
    }
  }

  return (
    <div className="animate-fade-in" id="result-panel">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] tracking-wider text-slate-500 uppercase">Final Optimized Prompt</p>
        {confirmed && promptText && (
          <button
            onClick={copyToClipboard}
            className="text-[10px] text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1"
            id="btn-copy-prompt"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
        )}
      </div>

  <div className={`code-block min-h-[80px] ${confirmed ? 'text-emerald-700 border-emerald-300' : 'text-slate-600'}`}>
        {confirmed && promptText ? (
          <span className="whitespace-pre-wrap">{promptText}</span>
        ) : (
          <span className="flex items-center gap-2 text-slate-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Confirm intent to reveal optimized prompt
          </span>
        )}
      </div>
    </div>
  );
}
