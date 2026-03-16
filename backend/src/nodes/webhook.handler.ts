import { BaseHandler } from './base.handler';
import { ExecContext } from '../engine/types';
import { logger } from '../utils/logger';

/**
 * Webhook Node — entry point of every workflow.
 * Passes the incoming HTTP payload through unchanged as the initial data.
 */
export class WebhookHandler extends BaseHandler {
  readonly type = 'webhook';

  async run(
    input: Record<string, unknown>,
    _config: Record<string, unknown>,
    ctx: ExecContext
  ): Promise<Record<string, unknown>> {
    logger.debug(
      {
        executionId: ctx.executionId,
        payloadKeys: Object.keys(input),
        payloadSize: JSON.stringify(input).length,
      },
      '[webhook] received payload'
    );
    return input;
  }
}
