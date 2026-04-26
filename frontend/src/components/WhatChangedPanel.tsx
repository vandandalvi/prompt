import type { PipelineResponse } from '../types';

interface WhatChangedPanelProps {
  result: PipelineResponse | null;
}

export function WhatChangedPanel({ result }: WhatChangedPanelProps) {
  if (!result) return null;

  const removed = result.what_changed.removed_words ?? [];
  const replaced = result.what_changed.replaced_words ?? {};
  const structured = result.what_changed.structured_output;
  const replacedKeys = Object.keys(replaced);

  return (
    <div className="animate-fade-in" id="what-changed-panel">
      <p className="text-[10px] tracking-wider text-slate-500 uppercase mb-3">What Changed</p>

      <div className="space-y-3">
        {/* Removed words */}
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5 font-medium">Removed ({removed.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {removed.length > 0 ? (
              removed.map((word, i) => (
                <span key={`${word}-${i}`} className="badge badge-rose text-[10px]">
                  <span className="line-through">{word}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-600">None</span>
            )}
          </div>
        </div>

        {/* Replaced */}
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5 font-medium">Replaced ({replacedKeys.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {replacedKeys.length > 0 ? (
              replacedKeys.map((key) => (
                <span key={key} className="badge badge-amber text-[10px]">
                  <span className="line-through">{key}</span> → {replaced[key]}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-600">None</span>
            )}
          </div>
        </div>

        {/* Structured */}
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5 font-medium">Structured Transformation</p>
          <div className="grid grid-cols-2 gap-1.5">
            {structured && Object.entries(structured).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-500">{key}:</span>
                <span className="text-sky-700 truncate">{val as string}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
