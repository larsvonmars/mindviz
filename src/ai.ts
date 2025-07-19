import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { MindMap } from './mindmap';

export interface AIOptions {
  /**
   * Provider factory from Vercel AI SDK, e.g. `openai` or `anthropic`.
   * Defaults to `openai`.
   */
  provider?: (modelName: string) => any;
  /**
   * Name of the model to use with the provider. Defaults to `gpt-4o`.
   */
  model?: string;
}

/**
 * Summarize a mind map using OpenAI via Vercel's AI SDK.
 * The OPENAI_API_KEY environment variable must be set.
 */
export async function summarizeMindMap(
  mindMap: MindMap,
  options: AIOptions = {}
): Promise<string> {
  const provider = options.provider ?? openai;
  const modelName = options.model ?? 'gpt-4o';
  const { text } = await generateText({
    model: provider(modelName),
    system: 'You are a helpful assistant that summarizes mind maps.',
    prompt: `Summarize the following mind map JSON:\n${mindMap.toJSON()}`,
  });
  return text.trim();
}

/**
 * Generate a list of mind map operations from a natural language prompt.
 * The AI should respond with a JSON array of operations compatible with
 * VisualMindMap.applyOperations().
 */
export async function generateOperations(
  prompt: string,
  options: AIOptions = {}
): Promise<any[]> {
  const provider = options.provider ?? openai;
  const modelName = options.model ?? 'gpt-4o';
  const { text } = await generateText({
    model: provider(modelName),
    system:
      'You are a mind map assistant. Respond ONLY with JSON representing mind map operations.',
    prompt,
  });
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`AI response was not valid JSON: ${text}`);
  }
}
