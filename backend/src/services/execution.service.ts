import { v4 as uuidv4 } from 'uuid';
import { executeWorkflow } from '../engine/executor';
import { workflowRepository } from '../repositories/workflow.repository';
import {
  executionRepository,
  ExecutionRecord,
} from '../repositories/execution.repository';
import { ExecContext } from '../engine/types';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export const executionService = {
  /**
   * Triggers a workflow execution asynchronously.
   * Returns the executionId immediately — callers poll /executions/:id for results.
   */
  async trigger(
    workflowId: string,
    payload: Record<string, unknown>
  ): Promise<{ executionId: string }> {
    logger.info(
      { workflowId, payloadKeys: Object.keys(payload) },
      '[execution] trigger received'
    );

    const workflow = await workflowRepository.findById(workflowId);
    if (!workflow) throw new NotFoundError('Workflow');

    const executionId = uuidv4();

    // Persist initial "running" state so the client can poll immediately
    await executionRepository.create({ workflowId, executionId, status: 'running' });

    logger.info(
      { executionId, workflowId },
      '[execution] persisted as running — starting background execution'
    );

    const ctx: ExecContext = {
      workflowId,
      executionId,
      log: [],
    };

    // Fire-and-forget: execution runs in background, HTTP response returns now
    executeWorkflow(workflow.definition, payload, ctx)
      .then(async () => {
        const lastOutput =
          ctx.log.length > 0 ? ctx.log[ctx.log.length - 1].output : payload;

        await executionRepository.update(executionId, {
          status: 'completed',
          resultJson: lastOutput,
          execLog: ctx.log,
        });

        logger.info(
          { executionId, workflowId, nodeCount: ctx.log.length },
          '[execution] completed successfully'
        );
      })
      .catch(async (err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err);

        await executionRepository.update(executionId, {
          status: 'failed',
          resultJson: { _error: errorMessage },
          execLog: ctx.log,
        });

        logger.error(
          { executionId, workflowId, error: errorMessage, completedNodes: ctx.log.length },
          '[execution] failed'
        );
      });

    return { executionId };
  },

  async getResult(executionId: string): Promise<ExecutionRecord> {
    const result = await executionRepository.findByExecutionId(executionId);
    if (!result) throw new NotFoundError('Execution');
    return result;
  },

  async listByWorkflow(workflowId: string): Promise<ExecutionRecord[]> {
    return executionRepository.findByWorkflowId(workflowId);
  },
};
