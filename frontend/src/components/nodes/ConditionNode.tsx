import { NodeProps } from 'reactflow';
import BaseNode, { SourceHandle } from './BaseNode';
import { NodeData } from '../../types';

interface Branch {
  operator: string;
  value: string;
}

export default function ConditionNode({ id, data, selected }: NodeProps<NodeData>) {
  const field = (data.config.field as string) ?? '';
  const branches = (data.config.branches as Branch[]) ?? [];

  // Each branch gets its own source handle; handle id = branch value
  const sourceHandles: SourceHandle[] =
    branches.length > 0
      ? branches.map((b) => ({ id: b.value, label: b.value }))
      : [{ id: '__default__', label: 'output' }];

  return (
    <BaseNode id={id} data={data} selected={selected} sourceHandles={sourceHandles}>
      <p className="text-xs text-gray-400">
        {field ? `if ${field} matches…` : 'No field configured'}
      </p>
      <p className="text-xs text-gray-300 pb-1">
        {branches.length} branch{branches.length !== 1 ? 'es' : ''}
      </p>
    </BaseNode>
  );
}
