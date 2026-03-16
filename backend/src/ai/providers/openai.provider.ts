import OpenAI from 'openai';
import { AIProvider } from '../provider.interface';
import { config } from '../../config';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private readonly client: OpenAI;

  constructor() {
    if (!config.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
    }
    this.client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a precise data extraction and classification assistant. ' +
            'Always respond with valid JSON only. ' +
            'Never include markdown, code fences, prose, or any text outside the JSON object.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    return response.choices[0]?.message?.content ?? '';
  }
}
