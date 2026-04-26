import { Link } from 'react-router-dom';
import type { OptimizationMode } from '../types';
import { useServerStatus } from '../hooks/useServerStatus';

interface HeaderProps {
  mode: OptimizationMode;
  onModeChange: (mode: OptimizationMode) => void;
}

const MODES: { key: OptimizationMode; label: string; desc: string }[] = [
  { key: 'balanced', label: 'Balanced', desc: 'Clear + readable' },
  { key: 'aggressive', label: 'Aggressive', desc: 'Minimal sentences' },
  { key: 'strict', label: 'Strict', desc: 'Keywords only' },
];

function formatWakeTime(secondsRemaining: number): string {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function Header({ mode, onModeChange }: HeaderProps) {
  const activeIndex = MODES.findIndex((m) => m.key === mode);
  const { status, secondsRemaining } = useServerStatus();

  const statusClass = status === 'online' ? 'badge-emerald' : status === 'checking' ? 'badge-violet' : 'badge-amber';
  const statusLabel = status === 'online'
    ? 'Server is On'
    : status === 'checking'
      ? 'Checking server'
      : `Wake timer ${formatWakeTime(secondsRemaining)}`;

  return (
    <header className="relative border-b border-slate-200/80 backdrop-blur-lg bg-white/80">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              Prompt Optimization Engine
            </h1>
            <p className="hidden text-[10px] text-slate-500 sm:block">Deterministic &middot; Multilingual &middot; Token-Efficient</p>
          </div>
        </div>

        <div className="mode-pill" id="mode-toggle">
          <div
            className="mode-indicator"
            style={{
              left: `${4 + activeIndex * 33.333}%`,
              width: '31.333%',
            }}
          />
          {MODES.map((m) => (
            <button
              key={m.key}
              id={`mode-${m.key}`}
              onClick={() => onModeChange(m.key)}
              className={mode === m.key ? 'active' : ''}
              title={m.desc}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className={`badge ${statusClass}`}>{statusLabel}</span>

          <Link to="/graph" id="nav-graph" className="btn-ghost text-xs">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Graph
          </Link>
        </div>
      </div>
    </header>
  );
}
