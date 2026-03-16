import { useCallback } from 'react';
import { Edge as RFEdge } from 'reactflow';
import { executionsApi } from '../api/executions.api';
import { useExecutionStore } from '../store/executionStore';

export function useExecution() {
  const { setExecutionId, setStatus, setResult, reset } = useExecutionStore();

  /**
   * Trigger a workflow and poll until it completes.
   * Updates the execution store throughout so all subscribers react.
   */
  const trigger = useCallback(
    async (
      workflowId: string,
      payload: Record<string, unknown>
    ): Promise<void> => {
      reset();
      setStatus('running');

      const { executionId } = await executionsApi.trigger(workflowId, payload);
      setExecutionId(executionId);

      // Poll every 1.5s until the execution is no longer "running"
      await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const MAX = 80; // ~2 minutes

        const interval = setInterval(async () => {
          attempts++;
          try {
            const result = await executionsApi.getResult(executionId);
            if (result.status !== 'running') {
              clearInterval(interval);
              setResult(result);
              resolve();
            } else if (attempts >= MAX) {
              clearInterval(interval);
              setStatus('failed');
              resolve();
            }
          } catch (err) {
            clearInterval(interval);
            setStatus('failed');
            reject(err);
          }
        }, 1500);
      });
    },
    [reset, setExecutionId, setStatus, setResult]
  );

  /**
   * After execution completes, apply visual highlighting to edges.
   * Call this in WorkflowEditorPage when execLog changes.
   */
  const buildHighlightedEdges = useCallback(
    (
      edges: RFEdge[],
      visitedNodeIds: Set<string>
    ): RFEdge[] =>
      edges.map((e) => {
        const traversed =
          visitedNodeIds.has(e.source) && visitedNodeIds.has(e.target);
        return {
          ...e,
          animated: traversed,
          style: traversed
            ? { stroke: '#10b981', strokeWidth: 2 }
            : { stroke: '#cbd5e1', strokeWidth: 1.5 },
        };
      }),
    []
  );

  return { trigger, buildHighlightedEdges };
}
