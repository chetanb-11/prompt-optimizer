import { generateJSON, countTokens } from './geminiService.js';
import { SCORING_PROMPT, SCORE_SCHEMA } from '../prompts/systemPrompts.js';

/**
 * Score a prompt on clarity, specificity, completeness, and token efficiency.
 * Returns structured scores, feedback, and improvement suggestions.
 */
export async function scorePrompt(prompt) {
  const userMessage = `PROMPT TO EVALUATE:\n"""${prompt}"""`;

  const result = await generateJSON(SCORING_PROMPT, userMessage, SCORE_SCHEMA);

  // Get token count for additional context
  const tokenCount = await countTokens(prompt);

  return {
    prompt,
    scores: result.scores,
    overall: Math.round(result.overall * 10) / 10,
    suggestions: result.suggestions,
    tokenCount,
    wordCount: prompt.split(/\s+/).filter(Boolean).length,
    charCount: prompt.length,
  };
}
