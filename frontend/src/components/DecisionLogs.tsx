interface DecisionLogsProps {
  logs: string[];
}

export function DecisionLogs({ logs }: DecisionLogsProps) {
  if (logs.length === 0) return null;

  return (
    <div className="animate-fade-in" id="decision-logs">
      <p className="text-[10px] tracking-wider text-slate-500 uppercase mb-3">Decision Logs</p>

      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {logs.map((log, idx) => (
          <div
            key={`${log}-${idx}`}
            className="flex items-start gap-2 text-[11px] text-slate-600 animate-fade-in"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] text-sky-700 font-mono">
              {idx + 1}
            </span>
            <span className="leading-relaxed">{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
