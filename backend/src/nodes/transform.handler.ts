import { BaseHandler } from './base.handler';
import { ExecContext } from '../engine/types';
import { interpolate } from '../utils/interpolate';
import { logger } from '../utils/logger';

interface FieldMapping {
  source?: string;   // existing field to rename/copy
  target: string;    // output field name
  value?: string;    // static value or {{template}} expression
}

/**
 * Transform Node — reshapes JSON data.
 *
 * Config:
 *   mappings: FieldMapping[]
 *
 * Behaviour per mapping:
 *   - If `value` is set: writes interpolated value to `target`
 *   - If `source` is set: renames `source` → `target` (removes original key)
 *   - Both can be set: `value` takes precedence
 */
export class TransformHandler extends BaseHandler {
  readonly type = 'transform';

  async run(
    input: Record<string, unknown>,
    config: Record<string, unknown>,
    ctx: ExecContext
  ): Promise<Record<string, unknown>> {
    const mappings = (config.mappings as FieldMapping[]) ?? [];
    const output: Record<string, unknown> = { ...input };

    logger.debug(
      { executionId: ctx.executionId, inputKeys: Object.keys(input), mappingCount: mappings.length },
      '[transform] starting'
    );

    for (const mapping of mappings) {
      if (mapping.value !== undefined) {
        const interpolated = interpolate(String(mapping.value), input);
        output[mapping.target] = interpolated;
        logger.debug(
          { executionId: ctx.executionId, target: mapping.target, value: interpolated },
          '[transform] set field from value'
        );
      } else if (mapping.source !== undefined) {
        output[mapping.target] = input[mapping.source];
        if (mapping.source !== mapping.target) {
          delete output[mapping.source];
          logger.debug(
            { executionId: ctx.executionId, source: mapping.source, target: mapping.target },
            '[transform] renamed field'
          );
        }
      } else {
        logger.warn(
          { executionId: ctx.executionId, mapping },
          '[transform] mapping has neither source nor value — skipping'
        );
      }
    }

    logger.debug(
      { executionId: ctx.executionId, outputKeys: Object.keys(output) },
      '[transform] completed'
    );

    return output;
  }
}
