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
export declare function summarizeMindMap(mindMap: MindMap, options?: AIOptions): Promise<string>;
/**
 * Generate a list of mind map operations from a natural language prompt.
 * The AI should respond with a JSON array of operations compatible with
 * VisualMindMap.applyOperations().
 */
export declare function generateOperations(prompt: string, options?: AIOptions): Promise<any[]>;
