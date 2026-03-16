import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeData } from '../../types';

export default function DelayNode({ id, data, selected }: NodeProps<NodeData>) {
  const delayMs = (data.config.delayMs as number) ?? 1000;
  const display = delayMs >= 1000 ? `${delayMs / 1000}s` : `${delayMs}ms`;

  return (
    <BaseNode id={id} data={data} selected={selected}>
      <p className="text-xs text-gray-400 pb-1">Wait {display}</p>
    </BaseNode>
  );
}
