import { create } from 'zustand';
import { ExecStatus, ExecLogEntry, ExecutionResult } from '../types';

interface ExecutionStore {
  executionId: string | null;
  status: ExecStatus;
  execLog: ExecLogEntry[];
  resultJson: Record<string, unknown> | null;
  visitedNodeIds: Set<string>;

  setExecutionId: (id: string) => void;
  setStatus: (status: ExecStatus) => void;
  setResult: (result: ExecutionResult) => void;
  reset: () => void;
}

export const useExecutionStore = create<ExecutionStore>()((set) => ({
  executionId: null,
  status: 'idle',
  execLog: [],
  resultJson: null,
  visitedNodeIds: new Set(),

  setExecutionId: (id) => set({ executionId: id }),
  setStatus: (status) => set({ status }),

  setResult: (result) =>
    set({
      status: result.status as ExecStatus,
      execLog: result.execLog,
      resultJson: result.resultJson,
      visitedNodeIds: new Set(result.execLog.map((e) => e.nodeId)),
    }),

  reset: () =>
    set({
      executionId: null,
      status: 'idle',
      execLog: [],
      resultJson: null,
      visitedNodeIds: new Set(),
    }),
}));
