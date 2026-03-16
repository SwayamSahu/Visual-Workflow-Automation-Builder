import React from 'react';
import { Handle, Position } from 'reactflow';
import { useExecutionStore } from '../../store/executionStore';
import { NODE_REGISTRY } from '../../config/nodeRegistry';
import { NodeData } from '../../types';

export interface SourceHandle {
  id: string;
  label: string;
}

interface BaseNodeProps {
  id: string;
  data: NodeData;
  selected: boolean;
  children: React.ReactNode;
  showTargetHandle?: boolean;
  showSourceHandle?: boolean;
  sourceHandles?: SourceHandle[]; // for ConditionNode multi-branch handles
}

export default function BaseNode({
  id,
  data,
  selected,
  children,
  showTargetHandle = true,
  showSourceHandle = true,
  sourceHandles,
}: BaseNodeProps) {
  const execLog = useExecutionStore((s) => s.execLog);
  const nodeLog = execLog.find((e) => e.nodeId === id);
  const meta = NODE_REGISTRY[data.type];

  const isSuccess = nodeLog?.status === 'success';
  const isError = nodeLog?.status === 'error';

  const leftBorderColor = isSuccess
    ? '#10b981'
    : isError
    ? '#ef4444'
    : meta?.color ?? '#6366f1';

  return (
    <div
      style={{ borderLeftColor: leftBorderColor }}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 border-l-4
        min-w-[190px] max-w-[220px] select-none
        transition-shadow duration-150
        ${selected ? 'shadow-md ring-2 ring-indigo-400 ring-opacity-60' : 'hover:shadow-md'}
        ${isError ? 'bg-red-50' : ''}
      `}
    >
      {/* Incoming handle */}
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-gray-300 !border-2 !border-white"
        />
      )}

      {/* Node header */}
      <div className="px-3 pt-2.5 pb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: meta?.bgColor, color: meta?.color }}
          >
            {meta?.label ?? data.type}
          </span>
          {nodeLog && (
            <span
              className={`text-sm font-bold ${isSuccess ? 'text-green-500' : 'text-red-500'}`}
            >
              {isSuccess ? '✓' : '✗'}
            </span>
          )}
        </div>
        {children}
      </div>

      {/* Single outgoing handle */}
      {showSourceHandle && !sourceHandles && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-gray-300 !border-2 !border-white"
        />
      )}

      {/* Multiple outgoing handles for Condition node */}
      {sourceHandles && (
        <div className="relative h-5">
          {sourceHandles.map((handle, idx) => (
            <React.Fragment key={`${idx}-${handle.id}`}>
              <Handle
                id={handle.id}
                type="source"
                position={Position.Bottom}
                style={{
                  left: `${((idx + 1) * 100) / (sourceHandles.length + 1)}%`,
                  bottom: 2,
                }}
                className="!w-3 !h-3 !bg-amber-400 !border-2 !border-white"
              />
              <span
                style={{
                  left: `${((idx + 1) * 100) / (sourceHandles.length + 1)}%`,
                  transform: 'translateX(-50%)',
                }}
                className="absolute bottom-[-14px] text-[9px] text-gray-400 whitespace-nowrap"
              >
                {handle.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
