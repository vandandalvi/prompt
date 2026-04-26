interface CountdownTimerProps {
  secondsRemaining: number;
  estimatedSeconds: number;
  progressPercent: number;
}

function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function CountdownTimer({
  secondsRemaining,
  estimatedSeconds,
  progressPercent,
}: CountdownTimerProps) {
  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Estimated time
          </p>
          <div className="server-countdown mt-1">{formatTime(secondsRemaining)}</div>
        </div>
        <p className="text-right text-xs text-slate-500">
          Based on recent wake time
          <br />
          Approx. {formatTime(estimatedSeconds)}
        </p>
      </div>

      <div className="progress-track mt-4">
        <div
          className="progress-fill"
          style={{ width: `${Math.max(6, progressPercent)}%` }}
        />
      </div>
    </div>
  );
}
