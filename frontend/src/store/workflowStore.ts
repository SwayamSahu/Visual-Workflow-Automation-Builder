import { create } from 'zustand';

interface WorkflowStore {
  workflowId: string | null;
  workflowName: string;
  selectedNodeId: string | null;
  activeTab: 'config' | 'run' | 'results';

  setWorkflowId: (id: string) => void;
  setWorkflowName: (name: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setActiveTab: (tab: 'config' | 'run' | 'results') => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowStore>()((set) => ({
  workflowId: null,
  workflowName: 'Untitled Workflow',
  selectedNodeId: null,
  activeTab: 'run',

  setWorkflowId: (id) => set({ workflowId: id }),
  setWorkflowName: (name) => set({ workflowName: name }),
  setSelectedNodeId: (id) =>
    set({ selectedNodeId: id, activeTab: id ? 'config' : 'run' }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  reset: () =>
    set({
      workflowId: null,
      workflowName: 'Untitled Workflow',
      selectedNodeId: null,
      activeTab: 'run',
    }),
}));
