"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeMindMap = summarizeMindMap;
exports.generateOperations = generateOperations;
const ai_1 = require("ai");
const openai_1 = require("@ai-sdk/openai");
/**
 * Summarize a mind map using OpenAI via Vercel's AI SDK.
 * The OPENAI_API_KEY environment variable must be set.
 */
async function summarizeMindMap(mindMap, options = {}) {
    const provider = options.provider ?? openai_1.openai;
    const modelName = options.model ?? 'gpt-4o';
    const { text } = await (0, ai_1.generateText)({
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
async function generateOperations(prompt, options = {}) {
    const provider = options.provider ?? openai_1.openai;
    const modelName = options.model ?? 'gpt-4o';
    const { text } = await (0, ai_1.generateText)({
        model: provider(modelName),
        system: 'You are a mind map assistant. Respond ONLY with JSON representing mind map operations.',
        prompt,
    });
    try {
        return JSON.parse(text);
    }
    catch (err) {
        throw new Error(`AI response was not valid JSON: ${text}`);
    }
}
