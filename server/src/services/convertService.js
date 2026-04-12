import { generateJSON } from './geminiService.js';
import { CONVERSION_PROMPTS, CONVERT_SCHEMA } from '../prompts/systemPrompts.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Convert a prompt into a specified format (JSON, Chat, API-ready).
 */
export async function convertPrompt({ prompt, format }) {
  const formatPrompt = CONVERSION_PROMPTS[format];
  if (!formatPrompt) {
    throw new AppError(
      `Unsupported format: "${format}". Use: json, chat, api.`,
      400,
      'INVALID_FORMAT'
    );
  }

  const userMessage = `PROMPT TO CONVERT:\n"""${prompt}"""`;

  const result = await generateJSON(formatPrompt, userMessage, CONVERT_SCHEMA);

  return {
    original: prompt,
    format,
    converted: result.converted,
    explanation: result.explanation,
  };
}
