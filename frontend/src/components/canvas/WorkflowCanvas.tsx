import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Connection,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  Node,
  Edge as RFEdge,
  useReactFlow,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { NODE_REGISTRY } from '../../config/nodeRegistry';
import { NodeData } from '../../types';
import WebhookNode from '../nodes/WebhookNode';
import TransformNode from '../nodes/TransformNode';
import AINode from '../nodes/AINode';
import ConditionNode from '../nodes/ConditionNode';
import EmailNode from '../nodes/EmailNode';
import StoreNode from '../nodes/StoreNode';
import DelayNode from '../nodes/DelayNode';
import CustomEdge from './CustomEdge';

// Register node + edge types OUTSIDE the component to avoid recreation on re-render
const nodeTypes = {
  webhook: WebhookNode,
  transform: TransformNode,
  ai: AINode,
  condition: ConditionNode,
  email: EmailNode,
  store: StoreNode,
  delay: DelayNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

interface WorkflowCanvasProps {
  nodes: Node<NodeData>[];
  edges: RFEdge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node<NodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<RFEdge[]>>;
  onNodeSelect: (nodeId: string | null) => void;
}

export default function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onNodeSelect,
}: WorkflowCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();

  // Create edge on node connection
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((prev) =>
        addEdge(
          {
            ...params,
            type: 'customEdge',
            animated: false,
            data: { condition: params.sourceHandle ?? undefined },
          },
          prev
        )
      );
    },
    [setEdges]
  );

  // Accept drag from NodePalette
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/reactflow');
      if (!nodeType || !NODE_REGISTRY[nodeType]) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = `${nodeType}-${Date.now()}`;

      const newNode: Node<NodeData> = {
        id,
        type: nodeType,
        position,
        data: {
          label: NODE_REGISTRY[nodeType].label,
          config: { ...NODE_REGISTRY[nodeType].defaultConfig },
          type: nodeType,
        },
      };

      setNodes((prev) => [...prev, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className="flex-1 h-full bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={(_, node) => onNodeSelect(node.id)}
        onPaneClick={() => onNodeSelect(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode="Backspace"
        defaultEdgeOptions={{ type: 'customEdge', animated: false }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
        <Controls className="!shadow-sm !rounded-lg !border-gray-200" />
        <MiniMap
          nodeColor={(node) => NODE_REGISTRY[node.type ?? '']?.color ?? '#94a3b8'}
          maskColor="rgb(241,245,249,0.7)"
          className="!rounded-lg !border-gray-200 !shadow-sm"
        />
      </ReactFlow>
    </div>
  );
}
