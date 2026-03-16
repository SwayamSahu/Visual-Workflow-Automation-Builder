import { BaseHandler } from './base.handler';
import { ExecContext } from '../engine/types';
import { getAIProvider } from '../ai/factory';
import { extractJSON } from '../ai/utils';
import { interpolate } from '../utils/interpolate';
import { logger } from '../utils/logger';

/**
 * AI Node — calls an LLM with a user-configured prompt.
 *
 * Config:
 *   prompt: string  — supports {{field}} interpolation from input data
 *
 * Behaviour:
 *   - Interpolates the prompt with current input data
 *   - Calls the configured AI provider (OpenAI or Gemini)
 *   - Attempts to parse JSON from the response
 *   - Merges parsed JSON into input and returns the combined object
 *   - Falls back to { ai_response: rawText } if JSON parsing fails
 */
export class AIHandler extends BaseHandler {
  readonly type = 'ai';

  async run(
    input: Record<string, unknown>,
    config: Record<string, unknown>,
    ctx: ExecContext
  ): Promise<Record<string, unknown>> {
    const promptTemplate = (config.prompt as string) ?? '';
    const prompt = interpolate(promptTemplate, input);

    const provider = getAIProvider();

    logger.debug(
      { executionId: ctx.executionId, provider: provider.name, promptPreview: prompt.slice(0, 300) },
      '[ai] sending prompt to provider'
    );

    const raw = await provider.complete(prompt);

    logger.debug(
      { executionId: ctx.executionId, provider: provider.name, responseLength: raw.length, responsePreview: raw.slice(0, 200) },
      '[ai] received response from provider'
    );

    try {
      const jsonStr = extractJSON(raw);
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
      logger.debug(
        { executionId: ctx.executionId, parsedKeys: Object.keys(parsed) },
        '[ai] successfully parsed JSON from response'
      );
      return { ...input, ...parsed };
    } catch {
      logger.warn(
        { executionId: ctx.executionId, provider: provider.name, rawPreview: raw.slice(0, 200) },
        '[ai] could not parse JSON from response — returning raw text'
      );
      return { ...input, ai_response: raw };
    }
  }
}
