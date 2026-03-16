import { prisma } from '../db/client';
import { ExecLogEntry } from '../engine/types';

export interface ExecutionRecord {
  id: string;
  workflowId: string;
  executionId: string;
  status: string;
  resultJson: Record<string, unknown> | null;
  execLog: ExecLogEntry[];
  createdAt: Date;
}

export const executionRepository = {
  async create(data: {
    workflowId: string;
    executionId: string;
    status: string;
  }): Promise<ExecutionRecord> {
    const row = await prisma.workflowResult.create({
      data: {
        workflowId: data.workflowId,
        executionId: data.executionId,
        status: data.status,
        execLog: [],
      },
    });
    return toRecord(row);
  },

  async update(
    executionId: string,
    data: {
      status: string;
      resultJson?: Record<string, unknown>;
      execLog?: ExecLogEntry[];
    }
  ): Promise<ExecutionRecord> {
    const row = await prisma.workflowResult.update({
      where: { executionId },
      data: {
        status: data.status,
        ...(data.resultJson !== undefined && {
          resultJson: data.resultJson as object,
        }),
        ...(data.execLog !== undefined && {
          execLog: data.execLog as unknown as object,
        }),
      },
    });
    return toRecord(row);
  },

  async findByExecutionId(executionId: string): Promise<ExecutionRecord | null> {
    const row = await prisma.workflowResult.findUnique({
      where: { executionId },
    });
    return row ? toRecord(row) : null;
  },

  async findByWorkflowId(workflowId: string): Promise<ExecutionRecord[]> {
    const rows = await prisma.workflowResult.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toRecord);
  },
};

function toRecord(row: {
  id: string;
  workflowId: string;
  executionId: string;
  status: string;
  resultJson: unknown;
  execLog: unknown;
  createdAt: Date;
}): ExecutionRecord {
  return {
    id: row.id,
    workflowId: row.workflowId,
    executionId: row.executionId,
    status: row.status,
    resultJson: (row.resultJson as Record<string, unknown>) ?? null,
    execLog: (row.execLog as ExecLogEntry[]) ?? [],
    createdAt: row.createdAt,
  };
}
