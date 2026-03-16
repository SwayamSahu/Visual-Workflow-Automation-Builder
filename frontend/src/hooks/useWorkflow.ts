import { useCallback, useState } from 'react';
import { Node, Edge as RFEdge } from 'reactflow';
import { toast } from 'sonner';
import { workflowsApi } from '../api/workflows.api';
import { useWorkflowStore } from '../store/workflowStore';
import { serializeFlow } from '../utils/serializeFlow';
import { deserializeFlow } from '../utils/deserializeFlow';
import { NodeData } from '../types';

export function useWorkflow() {
  const [loading, setLoading] = useState(false);
  const { workflowName, setWorkflowId, setWorkflowName } = useWorkflowStore();

  /**
   * Load a workflow from the backend and populate the React Flow canvas.
   */
  const load = useCallback(
    async (
      id: string,
      setNodes: (nodes: Node<NodeData>[]) => void,
      setEdges: (edges: RFEdge[]) => void
    ) => {
      setLoading(true);
      try {
        const wf = await workflowsApi.getById(id);
        setWorkflowId(wf.id);
        setWorkflowName(wf.name);
        const { nodes, edges } = deserializeFlow(wf.definition);
        setNodes(nodes);
        setEdges(edges);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load workflow');
      } finally {
        setLoading(false);
      }
    },
    [setWorkflowId, setWorkflowName]
  );

  /**
   * Serialize the current canvas and persist to the backend.
   */
  const save = useCallback(
    async (
      id: string,
      nodes: Node<NodeData>[],
      edges: RFEdge[]
    ): Promise<boolean> => {
      try {
        const definition = serializeFlow(nodes, edges);
        await workflowsApi.update(id, workflowName, definition);
        toast.success('Workflow saved');
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save workflow');
        return false;
      }
    },
    [workflowName]
  );

  return { load, save, loading };
}
