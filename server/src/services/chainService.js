import { generateJSON } from './geminiService.js';
import {
  MODE_PROMPTS,
  CHAIN_STEP_PROMPT,
  OPTIMIZE_SCHEMA,
} from '../prompts/systemPrompts.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Execute a multi-step optimization chain.
 * Each step takes the output of the previous step as input.
 */
export async function executeChain({ prompt, steps }) {
  if (!steps || steps.length === 0) {
    throw new AppError('At least one step is required.', 400, 'INVALID_CHAIN');
  }

  if (steps.length > 5) {
    throw new AppError('Maximum 5 steps allowed per chain.', 400, 'CHAIN_TOO_LONG');
  }

  const results = [];
  let currentPrompt = prompt;

  for (let i = 0; i < steps.length; i++) {
    const stepMode = steps[i];

    // Validate step mode
    const modeKey = stepMode === 'tone' ? 'tone_formal' : stepMode;
    if (!MODE_PROMPTS[modeKey]) {
      throw new AppError(
        `Invalid step mode: "${stepMode}" at position ${i + 1}.`,
        400,
        'INVALID_STEP'
      );
    }

    // Build system prompt for this step
    const basePrompt = MODE_PROMPTS[modeKey];
    const chainContext = CHAIN_STEP_PROMPT.replace('{STEP_MODE}', stepMode);
    const systemPrompt = `${basePrompt}\n\n${chainContext}`;

    const userMessage = `PROMPT (step ${i + 1} of ${steps.length}):\n"""${currentPrompt}"""`;

    // Execute step
    const result = await generateJSON(systemPrompt, userMessage, OPTIMIZE_SCHEMA);

    results.push({
      step: i + 1,
      mode: stepMode,
      result: result.optimized,
      explanation: result.explanation,
    });

    // Feed output to next step
    currentPrompt = result.optimized;
  }

  return {
    original: prompt,
    steps: results,
    final: currentPrompt,
  };
}
