import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

interface CustomNodeData {
  task: string;
  domain: string;
  format?: string;
  timestamp?: string;
  color: string;
  [key: string]: unknown;
}

function CustomNodeInner({ data }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div
      className="rounded-xl px-4 py-3 min-w-[200px] max-w-[280px] backdrop-blur-md"
      style={{
        background: 'rgba(255, 255, 255, 0.96)',
        border: `1px solid ${nodeData.color}40`,
        boxShadow: `0 6px 24px ${nodeData.color}20`,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-3 !h-3" style={{ background: nodeData.color }} />

      <p className="text-xs font-semibold text-slate-800 truncate mb-1.5">{nodeData.task}</p>
      <div className="flex flex-wrap gap-1.5">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: `${nodeData.color}15`,
            color: nodeData.color,
            border: `1px solid ${nodeData.color}30`,
          }}
        >
          {nodeData.domain}
        </span>
        {nodeData.format && (
          <span className="badge text-[10px]">{nodeData.format}</span>
        )}
      </div>
      {nodeData.timestamp && (
        <p className="text-[9px] text-slate-500 mt-1.5">
          {new Date(nodeData.timestamp).toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-3 !h-3" style={{ background: nodeData.color }} />
    </div>
  );
}

export const CustomNode = memo(CustomNodeInner);
