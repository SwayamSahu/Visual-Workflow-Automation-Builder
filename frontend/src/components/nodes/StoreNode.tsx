import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeData } from '../../types';

export default function StoreNode({ id, data, selected }: NodeProps<NodeData>) {
  return (
    <BaseNode id={id} data={data} selected={selected} showSourceHandle={false}>
      <p className="text-xs text-gray-400 pb-1">Saves result to database</p>
    </BaseNode>
  );
}
