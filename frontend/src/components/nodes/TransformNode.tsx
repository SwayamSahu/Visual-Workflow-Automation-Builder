import { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeData } from '../../types';

export default function TransformNode({ id, data, selected }: NodeProps<NodeData>) {
  const mappings = (data.config.mappings as unknown[]) ?? [];
  return (
    <BaseNode id={id} data={data} selected={selected}>
      <p className="text-xs text-gray-400 pb-1">
        {mappings.length > 0 ? `${mappings.length} mapping(s)` : 'No mappings configured'}
      </p>
    </BaseNode>
  );
}
