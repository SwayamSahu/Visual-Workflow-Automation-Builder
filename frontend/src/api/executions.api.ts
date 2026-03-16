import { apiClient } from './client';
import { ExecutionResult } from '../types';

export const executionsApi = {
  trigger: async (
    workflowId: string,
    payload: Record<string, unknown>
  ): Promise<{ executionId: string }> => {
    const res = await apiClient.post<{ data: { executionId: string } }>(
      `/api/workflows/${workflowId}/trigger`,
      payload
    );
    return res.data.data;
  },

  getResult: async (executionId: string): Promise<ExecutionResult> => {
    const res = await apiClient.get<{ data: ExecutionResult }>(
      `/api/executions/${executionId}`
    );
    return res.data.data;
  },
};
