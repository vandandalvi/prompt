import { CountdownTimer } from './CountdownTimer';
import { useServerStatus } from '../hooks/useServerStatus';

export function ServerOverlay() {
  const {
    overlayVisible,
    message,
    detail,
    secondsRemaining,
    estimatedSeconds,
    progressPercent,
    retryIntervalMs,
    wakeUrl,
    lastCheckDurationMs,
  } = useServerStatus();

  if (!overlayVisible) {
    return null;
  }

  return (
    <div className="server-overlay">
      <div className="server-overlay-card animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
          <span className="server-pulse" />
          Render Cold Start Protection
        </div>

        <div className="mt-6 flex justify-center">
          <div className="server-spinner" aria-hidden="true" />
        </div>

        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
          {message}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {detail}
        </p>

        <CountdownTimer
          secondsRemaining={secondsRemaining}
          estimatedSeconds={estimatedSeconds}
          progressPercent={progressPercent}
        />

        <div className="mt-5 grid gap-3 text-left text-xs text-slate-500 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <p className="font-semibold uppercase tracking-[0.16em] text-slate-600">Retry cadence</p>
            <p className="mt-1 text-sm text-slate-700">Every {Math.round(retryIntervalMs / 1000)} seconds</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <p className="font-semibold uppercase tracking-[0.16em] text-slate-600">Last health check</p>
            <p className="mt-1 text-sm text-slate-700">
              {lastCheckDurationMs ? `${(lastCheckDurationMs / 1000).toFixed(1)}s response time` : 'Waiting for first response'}
            </p>
          </div>
        </div>

        <a className="btn-primary mt-6" href={wakeUrl} target="_blank" rel="noreferrer">
          Open health check
        </a>
      </div>
    </div>
  );
}
