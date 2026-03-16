import { Node, Edge as RFEdge } from 'reactflow';
import { WorkflowDef, NodeDef, WorkflowEdge, NodeData } from '../types';

/**
 * Converts React Flow's internal nodes + edges into the WorkflowDef JSON
 * that the backend execution engine consumes.
 *
 * Positions are saved inside each NodeDef so the canvas layout is restored
 * on load without any separate state.
 */
export function serializeFlow(
  nodes: Node<NodeData>[],
  edges: RFEdge[]
): WorkflowDef {
  const workflowNodes: NodeDef[] = nodes.map((n) => ({
    id: n.id,
    type: n.type ?? 'unknown',
    label: n.data.label,
    config: n.data.config ?? {},
    position: n.position,
  }));

  const workflowEdges: WorkflowEdge[] = edges.map((e) => ({
    source: e.source,
    target: e.target,
    // sourceHandle holds the branch value for Condition node edges
    condition: (e.sourceHandle ?? e.data?.condition) as string | undefined,
  }));

  return { nodes: workflowNodes, edges: workflowEdges };
}
