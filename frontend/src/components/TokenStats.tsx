import type { PipelineResponse } from '../types';

interface TokenStatsProps {
  result: PipelineResponse | null;
}

export function TokenStats({ result }: TokenStatsProps) {
  const raw = result?.token_stats.raw_tokens ?? 0;
  const opt = result?.token_stats.optimized_tokens ?? 0;
  const reduction = result?.token_stats.reduction_percent ?? 0;

  const barWidth = raw > 0 ? Math.max(5, Math.round((opt / raw) * 100)) : 100;
  const savedWidth = Math.max(0, 100 - barWidth);

  return (
    <div className="animate-fade-in" id="token-stats">
      <p className="text-[10px] tracking-wider text-slate-500 uppercase mb-3">Token Optimization</p>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat-box">
          <div className="stat-value">{raw}</div>
          <div className="stat-label">Raw</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{opt}</div>
          <div className="stat-label">Optimized</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{
            backgroundImage: reduction > 20
              ? 'linear-gradient(135deg, #34d399, #22d3ee)'
              : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          }}>
            {reduction}%
          </div>
          <div className="stat-label">Saved</div>
        </div>
      </div>

      {/* Visual bar */}
      {result && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
            <span>Optimized ({barWidth}%)</span>
            <span>Saved ({savedWidth}%)</span>
          </div>
          <div className="progress-track h-3 flex overflow-hidden rounded-full">
            <div
              className="h-full rounded-l-full transition-all duration-1000 ease-out"
              style={{
                width: `${barWidth}%`,
                background: 'linear-gradient(90deg, #22d3ee, #6366f1)',
              }}
            />
            <div
              className="h-full rounded-r-full transition-all duration-1000 ease-out"
              style={{
                width: `${savedWidth}%`,
                background: 'linear-gradient(90deg, #34d399, #059669)',
                opacity: 0.4,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
