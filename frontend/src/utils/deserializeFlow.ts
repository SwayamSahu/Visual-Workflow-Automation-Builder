import { Node, Edge as RFEdge } from 'reactflow';
import { WorkflowDef, NodeData } from '../types';
import { NODE_REGISTRY } from '../config/nodeRegistry';

/**
 * Converts a WorkflowDef (from the backend / DB) into React Flow nodes + edges.
 * Restores saved positions; falls back to a vertical auto-layout.
 */
export function deserializeFlow(def: WorkflowDef): {
  nodes: Node<NodeData>[];
  edges: RFEdge[];
} {
  const nodes: Node<NodeData>[] = def.nodes.map((n, idx) => ({
    id: n.id,
    type: n.type,
    // Use saved position, otherwise auto-layout vertically
    position: n.position ?? { x: 300, y: idx * 160 },
    data: {
      label: n.label ?? NODE_REGISTRY[n.type]?.label ?? n.type,
      config: n.config ?? {},
      type: n.type,
    },
  }));

  const edges: RFEdge[] = def.edges.map((e) => ({
    id: `${e.source}-${e.target}-${e.condition ?? 'default'}`,
    source: e.source,
    target: e.target,
    sourceHandle: e.condition ?? null,
    type: 'customEdge',
    animated: false,
    data: { condition: e.condition },
    label: e.condition,
  }));

  return { nodes, edges };
}
