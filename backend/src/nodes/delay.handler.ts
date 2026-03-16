import { BaseHandler } from './base.handler';
import { ExecContext } from '../engine/types';
import { logger } from '../utils/logger';

/**
 * Delay Node — pauses execution for a configurable duration.
 *
 * Config:
 *   delayMs: number  — milliseconds to wait (default 1000, capped at 30000)
 *
 * Behaviour:
 *   - Waits for the specified duration, then passes input through unchanged
 */
export class DelayHandler extends BaseHandler {
  readonly type = 'delay';

  private static readonly MAX_DELAY_MS = 30_000;

  async run(
    input: Record<string, unknown>,
    config: Record<string, unknown>,
    ctx: ExecContext
  ): Promise<Record<string, unknown>> {
    const requested = Number(config.delayMs ?? 1000);
    const delayMs = Math.min(
      Math.max(0, isNaN(requested) ? 1000 : requested),
      DelayHandler.MAX_DELAY_MS
    );

    logger.info(
      { executionId: ctx.executionId, delayMs },
      `[delay] waiting ${delayMs}ms`
    );

    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));

    return input;
  }
}
