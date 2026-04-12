import { generateJSON } from './geminiService.js';
import {
  COMPARISON_PROMPT,
  COMPARE_SCHEMA,
  MODE_PROMPTS,
} from '../prompts/systemPrompts.js';

/**
 * Generate multiple optimized variants of a prompt for A/B testing.
 */
export async function comparePrompts({ prompt, variants = 3, mode = 'clarity' }) {
  const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.clarity;

  const systemPrompt = `${modePrompt}\n\n${COMPARISON_PROMPT}\n\nGenerate exactly ${variants} variants.`;

  const userMessage = `PROMPT TO CREATE ${variants} VARIANTS OF:\n"""${prompt}"""`;

  const result = await generateJSON(systemPrompt, userMessage, COMPARE_SCHEMA);

  return {
    original: prompt,
    mode,
    variants: result.variants,
  };
}
