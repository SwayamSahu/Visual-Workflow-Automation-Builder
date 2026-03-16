import { BaseHandler } from './base.handler';
import { ExecContext } from '../engine/types';
import { prisma } from '../db/client';
import { logger } from '../utils/logger';

/**
 * Store Node — persists the current workflow data to the database.
 *
 * Writes result_json and the full execution log to the workflow_results table.
 * Uses upsert so that multiple store nodes in the same execution don't conflict.
 * Returns input unchanged — store is a terminal/passthrough node.
 */
export class StoreHandler extends BaseHandler {
  readonly type = 'store';

  async run(
    input: Record<string, unknown>,
    _config: Record<string, unknown>,
    ctx: ExecContext
  ): Promise<Record<string, unknown>> {
    await prisma.workflowResult.upsert({
      where: { executionId: ctx.executionId },
      create: {
        workflowId: ctx.workflowId,
        executionId: ctx.executionId,
        status: 'completed',
        resultJson: input as object,
        execLog: ctx.log as unknown as object,
      },
      update: {
        resultJson: input as object,
        status: 'completed',
        execLog: ctx.log as unknown as object,
      },
    });

    logger.info(
      { executionId: ctx.executionId, workflowId: ctx.workflowId },
      'Workflow result stored'
    );

    return input;
  }
}
