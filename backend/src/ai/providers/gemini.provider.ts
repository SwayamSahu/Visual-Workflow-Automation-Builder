import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from '../provider.interface';
import { config } from '../../config';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private readonly client: GoogleGenerativeAI;

  constructor() {
    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required when AI_PROVIDER=gemini');
    }
    this.client = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }

  async complete(prompt: string): Promise<string> {
    const model = this.client.getGenerativeModel({ model: 'gemini-3-flash-preview' }); 
    // const model = this.client.getGenerativeModel({
    //   model: 'gemini-2.0-flash',
    //   systemInstruction:
    //     'You are a precise data extraction and classification assistant. ' +
    //     'Always respond with valid JSON only. ' +
    //     'Never include markdown, code fences, prose, or any text outside the JSON object.',
    //   generationConfig: {
    //     temperature: 0,
    //     responseMimeType: 'application/json',
    //   },
    // });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
