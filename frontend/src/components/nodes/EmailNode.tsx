import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeData } from '../../types';

export default function EmailNode({ id, data, selected }: NodeProps<NodeData>) {
  const to = (data.config.to as string) ?? '';
  const mode = (data.config.mode as string) ?? 'template';
  return (
    <BaseNode id={id} data={data} selected={selected}>
      <p className="text-xs text-gray-400 truncate pb-0.5">
        To: {to || <span className="italic">not set</span>}
      </p>
      <p className="text-xs text-gray-300 pb-1 capitalize">{mode} mode</p>
    </BaseNode>
  );
}
