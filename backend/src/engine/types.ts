// ─── Workflow Definition ──────────────────────────────────────────────────────

export interface NodeDef {
  id: string;
  type: string;
  config: Record<string, unknown>;
  label?: string;
  position?: { x: number; y: number };
}

export interface Edge {
  source: string;
  target: string;
  condition?: string; // set on edges from condition nodes
}

export interface WorkflowDef {
  nodes: NodeDef[];
  edges: Edge[];
}

// ─── Execution ────────────────────────────────────────────────────────────────

export type ExecStatus = 'running' | 'completed' | 'failed';
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

export interface ExecContext {
  workflowId: string;
  executionId: string;
  log: ExecLogEntry[];
}

// ─── Node Handler Interface ───────────────────────────────────────────────────

export interface NodeHandler {
  readonly type: string;
  run(
    input: Record<string, unknown>,
    config: Record<string, unknown>,
    ctx: ExecContext
  ): Promise<Record<string, unknown>>;
}
