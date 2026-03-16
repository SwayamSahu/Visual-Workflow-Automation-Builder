import { BaseHandler } from './base.handler';
import { ExecContext } from '../engine/types';
import { logger } from '../utils/logger';

type Operator = 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt';

interface Branch {
  operator: Operator;
  value: string;
  target: string; // target node id (used by executor to follow the right edge)
}

/**
 * Condition Node — routes execution down a matching branch.
 *
 * Config:
 *   field:    string    — the input field to evaluate
 *   branches: Branch[]  — ordered list of conditions to test
 *
 * Behaviour:
 *   - Evaluates branches in order, returns on first match
 *   - Writes `_branch` into output (executor reads this to pick the right edge)
 *   - Does NOT modify any other input data — passes through unchanged
 *   - If no branch matches: sets _branch to null (executor halts the path)
 */
export class ConditionHandler extends BaseHandler {
  readonly type = 'condition';

  async run(
    input: Record<string, unknown>,
    config: Record<string, unknown>,
    _ctx: ExecContext
  ): Promise<Record<string, unknown>> {
    const field = config.field as string;
    const branches = (config.branches as Branch[]) ?? [];
    const fieldValue = input[field];

    for (const branch of branches) {
      if (this.evaluate(fieldValue, branch.operator, branch.value)) {
        logger.debug(
          { field, fieldValue, matchedBranch: branch.value },
          'Condition matched'
        );
        return { ...input, _branch: branch.value };
      }
    }

    logger.warn(
      { field, fieldValue, branches: branches.map((b) => b.value) },
      'Condition node: no matching branch — halting path'
    );
    return { ...input, _branch: null };
  }

  private evaluate(actual: unknown, operator: Operator, expected: string): boolean {
    const actualStr = String(actual ?? '').trim();
    const expectedStr = expected.trim();

    switch (operator) {
      case 'equals':     return actualStr === expectedStr;
      case 'not_equals': return actualStr !== expectedStr;
      case 'contains':   return actualStr.toLowerCase().includes(expectedStr.toLowerCase());
      case 'gt':         return Number(actual) > Number(expected);
      case 'lt':         return Number(actual) < Number(expected);
      default:           return false;
    }
  }
}
