import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeData } from '../../types';

export default function AINode({ id, data, selected }: NodeProps<NodeData>) {
  const prompt = (data.config.prompt as string) ?? '';
  return (
    <BaseNode id={id} data={data} selected={selected}>
      <p className="text-xs text-gray-400 pb-1 truncate">
        {prompt ? `"${prompt.slice(0, 45)}${prompt.length > 45 ? '…' : ''}"` : 'No prompt set'}
      </p>
    </BaseNode>
  );
}
