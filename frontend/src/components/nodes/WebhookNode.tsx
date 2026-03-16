import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeData } from '../../types';

export default function WebhookNode({ id, data, selected }: NodeProps<NodeData>) {
  return (
    <BaseNode id={id} data={data} selected={selected} showTargetHandle={false}>
      <p className="text-xs text-gray-400 pb-1">Workflow entry point</p>
    </BaseNode>
  );
}
