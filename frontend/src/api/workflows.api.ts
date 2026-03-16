import { apiClient } from './client';
import { WorkflowRecord, WorkflowDef } from '../types';

export const workflowsApi = {
  list: async (): Promise<WorkflowRecord[]> => {
    const res = await apiClient.get<{ data: WorkflowRecord[] }>('/api/workflows');
    return res.data.data;
  },

  getById: async (id: string): Promise<WorkflowRecord> => {
    const res = await apiClient.get<{ data: WorkflowRecord }>(`/api/workflows/${id}`);
    return res.data.data;
  },

  create: async (name: string, definition: WorkflowDef): Promise<WorkflowRecord> => {
    const res = await apiClient.post<{ data: WorkflowRecord }>('/api/workflows', {
      name,
      definition,
    });
    return res.data.data;
  },

  update: async (
    id: string,
    name: string,
    definition: WorkflowDef
  ): Promise<WorkflowRecord> => {
    const res = await apiClient.put<{ data: WorkflowRecord }>(`/api/workflows/${id}`, {
      name,
      definition,
    });
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/workflows/${id}`);
  },
};
