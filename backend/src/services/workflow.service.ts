import {
  workflowRepository,
  WorkflowRecord,
} from '../repositories/workflow.repository';
import { WorkflowDef } from '../engine/types';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export const workflowService = {
  async list(): Promise<WorkflowRecord[]> {
    return workflowRepository.findAll();
  },

  async getById(id: string): Promise<WorkflowRecord> {
    const workflow = await workflowRepository.findById(id);
    if (!workflow) throw new NotFoundError('Workflow');
    return workflow;
  },

  async create(name: string, definition: WorkflowDef): Promise<WorkflowRecord> {
    validateName(name);
    validateDefinition(definition);
    logger.info(
      { name, nodeCount: definition.nodes.length, edgeCount: definition.edges.length },
      '[workflow] creating workflow'
    );
    return workflowRepository.create(name, definition);
  },

  async update(
    id: string,
    name: string,
    definition: WorkflowDef
  ): Promise<WorkflowRecord> {
    await workflowService.getById(id); // throws NotFoundError if missing
    validateName(name);
    validateDefinition(definition);
    logger.info(
      { id, name, nodeCount: definition.nodes.length, edgeCount: definition.edges.length },
      '[workflow] updating workflow'
    );
    return workflowRepository.update(id, name, definition);
  },

  async delete(id: string): Promise<void> {
    await workflowService.getById(id);
    logger.info({ id }, '[workflow] deleting workflow');
    await workflowRepository.delete(id);
  },
};

// ─── Private Validators ───────────────────────────────────────────────────────

function validateName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Workflow name must not be empty');
  }
}

function validateDefinition(def: WorkflowDef): void {
  if (!def || typeof def !== 'object') {
    throw new ValidationError('Workflow definition must be an object');
  }
  if (!Array.isArray(def.nodes)) {
    throw new ValidationError('Workflow definition must have a nodes array');
  }
  if (!Array.isArray(def.edges)) {
    throw new ValidationError('Workflow definition must have an edges array');
  }

  // Validate all edge references point to real nodes
  const nodeIds = new Set(def.nodes.map((n) => n.id));
  for (const edge of def.edges) {
    if (!nodeIds.has(edge.source)) {
      throw new ValidationError(
        `Edge source "${edge.source}" references a node that does not exist`
      );
    }
    if (!nodeIds.has(edge.target)) {
      throw new ValidationError(
        `Edge target "${edge.target}" references a node that does not exist`
      );
    }
  }
}
