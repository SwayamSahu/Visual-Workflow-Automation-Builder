import { NodeHandler, ExecContext } from '../engine/types';

/**
 * Abstract base class for all node handlers.
 * Enforces the NodeHandler interface and provides a common extension point.
 */
export abstract class BaseHandler implements NodeHandler {
  abstract readonly type: string;

  abstract run(
    input: Record<string, unknown>,
    config: Record<string, unknown>,
    ctx: ExecContext
  ): Promise<Record<string, unknown>>;
}
