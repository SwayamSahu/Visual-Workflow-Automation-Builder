import { AIProvider } from './provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { config } from '../config';

// Lazy singleton — instantiated on first use
let instance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!instance) {
    instance =
      config.AI_PROVIDER === 'gemini'
        ? new GeminiProvider()
        : new OpenAIProvider();
  }
  return instance;
}

// Reset for testing
export function resetAIProvider(): void {
  instance = null;
}
