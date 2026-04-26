import { useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Link } from 'react-router-dom';
import { getInteractions } from '../lib/api';
import { CustomNode } from '../components/CustomNode';
import type { ServerStatus } from '../App';

const nodeTypes = { custom: CustomNode };

const DOMAIN_COLORS: Record<string, string> = {
  marketing: '#f472b6',
  fitness: '#34d399',
  software: '#60a5fa',
  education: '#a78bfa',
  finance: '#fbbf24',
  health: '#22d3ee',
  general: '#94a3b8',
};

interface GraphPageProps {
  serverStatus: ServerStatus;
  secondsRemaining: number;
  wakeUrl: string;
}

function getDomainColor(domain: string): string {
  const lower = (domain || 'general').toLowerCase();
  return DOMAIN_COLORS[lower] ?? DOMAIN_COLORS.general;
}

function formatWakeTime(secondsRemaining: number): string {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function GraphPage({ serverStatus, secondsRemaining, wakeUrl }: GraphPageProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const wakeInProgress = serverStatus === 'waking' || serverStatus === 'offline';

  useEffect(() => {
    if (serverStatus !== 'online') {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getInteractions()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [serverStatus]);

  const { nodes, edges } = useMemo(() => {
    if (!items.length) return { nodes: [] as Node[], edges: [] as Edge[] };

    const graphNodes: Node[] = items.slice(0, 30).map((item, index) => {
      const domain = item.intent?.domain ?? 'general';
      const color = getDomainColor(domain);
      return {
        id: `n-${item.id}`,
        type: 'custom',
        data: {
          task: item.intent?.task ?? 'Task',
          domain,
          format: item.intent?.output_format,
          timestamp: item.created_at,
          color,
        },
        position: {
          x: 100 + (index % 4) * 320,
          y: 100 + Math.floor(index / 4) * 180,
        },
      };
    });

    const graphEdges: Edge[] = [];
    for (let i = 0; i < graphNodes.length; i++) {
      for (let j = i + 1; j < graphNodes.length; j++) {
        const a = graphNodes[i].data as { domain: string; task: string };
        const b = graphNodes[j].data as { domain: string; task: string };

        let related = false;
        let label = '';

        if (a.domain === b.domain) {
          related = true;
          label = a.domain;
        }

        if (!related) {
          const aWords = new Set((a.task || '').toLowerCase().split(/\s+/));
          const bWords = (b.task || '').toLowerCase().split(/\s+/);
          const overlap = bWords.filter((w) => w.length > 3 && aWords.has(w));
          if (overlap.length > 0) {
            related = true;
            label = overlap[0];
          }
        }

        if (related) {
          graphEdges.push({
            id: `e-${graphNodes[i].id}-${graphNodes[j].id}`,
            source: graphNodes[i].id,
            target: graphNodes[j].id,
            animated: true,
            label,
            style: { stroke: getDomainColor(a.domain), strokeWidth: 1.5, opacity: 0.6 },
            labelStyle: { fill: '#94a3b8', fontSize: 10 },
          });
        }
      }
    }

    if (graphEdges.length === 0 && graphNodes.length > 1) {
      for (let i = 0; i < graphNodes.length - 1; i++) {
        graphEdges.push({
          id: `e-seq-${i}`,
          source: graphNodes[i].id,
          target: graphNodes[i + 1].id,
          animated: true,
          style: { stroke: '#475569', strokeWidth: 1, opacity: 0.4 },
        });
      }
    }

    return { nodes: graphNodes, edges: graphEdges };
  }, [items]);

  const domains = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      const d = item.intent?.domain;
      if (d) set.add(d.toLowerCase());
    });
    return Array.from(set);
  }, [items]);

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-lg px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900">Interaction Graph</h1>
            <p className="text-[10px] text-slate-500">
              {items.length} interaction{items.length !== 1 ? 's' : ''} visualized
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {domains.map((d) => (
            <div key={d} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: getDomainColor(d) }} />
              <span className="text-[10px] text-slate-400 capitalize">{d}</span>
            </div>
          ))}
        </div>

        <Link className="btn-ghost text-xs" to="/" id="nav-back">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
      </div>

      <div className="flex-1 relative">
        {wakeInProgress && (
          <div className="server-overlay">
            <div className="server-overlay-card">
              <div className="badge badge-amber">Render Free Tier Wake-Up</div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">Graph is waiting for the backend</h2>
              <p className="mt-2 text-sm text-slate-600">
                The interaction graph depends on stored backend records. As soon as Render wakes up, this page will refresh automatically.
              </p>
              <div className="server-countdown mt-5">{formatWakeTime(secondsRemaining)}</div>
              <a className="btn-primary mt-6" href={wakeUrl} target="_blank" rel="noreferrer">
                Wake Server Link
              </a>
            </div>
          </div>
        )}

        <div className={wakeInProgress ? 'app-shell-muted h-full' : 'h-full'}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <svg className="h-8 w-8 animate-spin text-sky-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs text-slate-500">Loading interactions...</span>
              </div>
            </div>
          ) : nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center glass-card max-w-sm">
                <div className="text-4xl mb-3">Graph</div>
                <h2 className="text-sm font-semibold text-slate-800 mb-2">No interactions yet</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Process some prompts on the Engine page to see your interaction graph here.
                </p>
                <Link to="/" className="btn-primary text-xs">Go to Engine</Link>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <MiniMap
                nodeColor={(node) => {
                  const d = node.data as { color?: string };
                  return d?.color ?? '#475569';
                }}
                style={{ background: 'rgba(255,255,255,0.95)' }}
              />
              <Controls />
              <Background color="#cbd5e1" gap={24} size={1} />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
}
