import { prisma } from '../db/client';
import { WorkflowDef } from '../engine/types';

export interface WorkflowRecord {
  id: string;
  name: string;
  definition: WorkflowDef;
  createdAt: Date;
  updatedAt: Date;
}

export const workflowRepository = {
  async findAll(): Promise<WorkflowRecord[]> {
    const rows = await prisma.workflow.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toRecord);
  },

  async findById(id: string): Promise<WorkflowRecord | null> {
    const row = await prisma.workflow.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  },

  async create(name: string, definition: WorkflowDef): Promise<WorkflowRecord> {
    const row = await prisma.workflow.create({
      data: { name, definition: definition as object },
    });
    return toRecord(row);
  },

  async update(
    id: string,
    name: string,
    definition: WorkflowDef
  ): Promise<WorkflowRecord> {
    const row = await prisma.workflow.update({
      where: { id },
      data: { name, definition: definition as object },
    });
    return toRecord(row);
  },

  async delete(id: string): Promise<void> {
    await prisma.workflow.delete({ where: { id } });
  },
};

function toRecord(row: {
  id: string;
  name: string;
  definition: unknown;
  createdAt: Date;
  updatedAt: Date;
}): WorkflowRecord {
  return {
    id: row.id,
    name: row.name,
    definition: row.definition as WorkflowDef,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
