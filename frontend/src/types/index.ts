// ─── Workflow Definition (mirrors backend engine/types.ts) ────────────────────

export interface NodeDef {
  id: string;
  type: string;
  config: Record<string, unknown>;
  label?: string;
  position?: { x: number; y: number }; // persisted so canvas layout is restored
}

export interface WorkflowEdge {
  source: string;
  target: string;
  condition?: string; // set on edges from Condition nodes
}

export interface WorkflowDef {
  nodes: NodeDef[];
  edges: WorkflowEdge[];
}

// ─── Execution ────────────────────────────────────────────────────────────────

export type ExecStatus = 'idle' | 'running' | 'completed' | 'failed';
export type NodeExecStatus = 'success' | 'error' | 'skipped';

export interface ExecLogEntry {
  nodeId: string;
  nodeType: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: NodeExecStatus;
  error?: string;
  timestamp: string;
  durationMs: number;
}

export interface ExecutionResult {
  id: string;
  workflowId: string;
  executionId: string;
  status: 'running' | 'completed' | 'failed';
  resultJson: Record<string, unknown> | null;
  execLog: ExecLogEntry[];
  createdAt: string;
}

// ─── Workflow Record (API response) ───────────────────────────────────────────

export interface WorkflowRecord {
  id: string;
  name: string;
  definition: WorkflowDef;
  createdAt: string;
  updatedAt: string;
}

// ─── React Flow Node Data ─────────────────────────────────────────────────────

export interface NodeData {
  label: string;
  config: Record<string, unknown>;
  type: string;
}
