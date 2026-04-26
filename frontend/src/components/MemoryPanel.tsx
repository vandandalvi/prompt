import type { MemoryEntry, PipelineResponse } from '../types';

interface MemoryPanelProps {
  result: PipelineResponse | null;
  memory: MemoryEntry[];
  onSave: () => void;
  onSkip: () => void;
  saved: boolean;
  skipped?: boolean;
}

export function MemoryPanel({ result, memory, onSave, onSkip, saved, skipped }: MemoryPanelProps) {
  const actionTaken = saved || skipped;

  return (
    <div className="glass-card animate-slide-up" id="memory-panel" style={{ animationDelay: '0.2s' }}>
      <div className="panel-title">Memory</div>

      {/* Save/Skip prompt */}
      {result && !actionTaken && (
        <div className="mb-4 rounded-xl p-4 border border-slate-200 bg-slate-50/80 animate-fade-in">
          <p className="text-sm text-slate-700 mb-1 font-medium">Save this interaction?</p>
          <p className="text-[10px] text-slate-500 mb-3">
            Saved entries inform future prompt suggestions via context memory.
          </p>
          <div className="flex gap-2">
            <button id="btn-save-memory" onClick={onSave} className="btn-success flex-1 text-xs">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Save to Memory
            </button>
            <button
              id="btn-skip-memory"
              onClick={onSkip}
              className="btn-ghost flex-1 text-xs"
              style={{ borderColor: 'rgba(245,158,11,0.35)', color: '#d97706' }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Saved confirmation */}
      {saved && result && (
        <div className="mb-4 rounded-xl p-3 border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2 animate-fade-in">
          <svg className="h-4 w-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-xs font-medium text-emerald-400">Saved to memory</p>
            <p className="text-[10px] text-emerald-500/70 mt-0.5">Interaction logged to localStorage + backend SQLite</p>
          </div>
        </div>
      )}

      {/* Skipped confirmation */}
      {skipped && !saved && result && (
        <div className="mb-4 rounded-xl p-3 border border-amber-500/20 bg-amber-500/5 flex items-center gap-2 animate-fade-in">
          <svg className="h-4 w-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          <div>
            <p className="text-xs font-medium text-amber-400">Memory skipped</p>
            <p className="text-[10px] text-amber-500/70 mt-0.5">This interaction was not saved. Decision logged.</p>
          </div>
        </div>
      )}

      {/* Memory Cards */}
      <p className="text-[10px] tracking-wider text-slate-500 uppercase mb-2">
        Recent ({memory.length}/5)
      </p>

      {memory.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center bg-white/70">
          <p className="text-xs text-slate-600">No saved memory yet</p>
          <p className="text-[10px] text-slate-500 mt-1">Interactions you save will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {memory.map((m, idx) => (
            <div key={m.id} className="memory-card animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{m.task}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="badge badge-cyan text-[10px]">{m.domain}</span>
                    <span className="badge text-[10px]">{m.format}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 flex-shrink-0">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
