import { generateJSON, generateJSONStream, countTokens } from './geminiService.js';
import {
  MODE_PROMPTS,
  PRESET_INSTRUCTIONS,
  OPTIMIZE_SCHEMA,
} from '../prompts/systemPrompts.js';
import { estimateCost } from '../utils/tokenEstimator.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Optimize a prompt using the specified mode and optional preset.
 */
export async function optimizePrompt({ prompt, mode, toneStyle, preset, context }) {
  // Build the system prompt
  let systemPrompt = getSystemPrompt(mode, toneStyle);

  // Append preset-specific instructions if provided
  if (preset && PRESET_INSTRUCTIONS[preset]) {
    systemPrompt += '\n\n' + PRESET_INSTRUCTIONS[preset];
  }

  // Build the user prompt with optional context
  let userMessage = `PROMPT TO OPTIMIZE:\n"""${prompt}"""`;
  if (context) {
    userMessage = `CONTEXT (use this to inform your optimization):\n"""${context}"""\n\n${userMessage}`;
  }

  // Call Gemini
  const result = await generateJSON(systemPrompt, userMessage, OPTIMIZE_SCHEMA);

  // Count tokens
  const [originalTokens, optimizedTokens] = await Promise.all([
    countTokens(prompt),
    countTokens(result.optimized),
  ]);

  // Estimate costs
  const cost = estimateCost(originalTokens, optimizedTokens);

  return {
    original: prompt,
    optimized: result.optimized,
    explanation: result.explanation,
    mode,
    preset: preset || null,
    tokenCount: {
      original: originalTokens,
      optimized: optimizedTokens,
    },
    estimatedCost: cost,
  };
}

/**
 * Re-optimize an already-optimized prompt (iterative refinement).
 */
export async function reOptimize({ prompt, mode, toneStyle, iteration }) {
  let systemPrompt = getSystemPrompt(mode, toneStyle);
  systemPrompt += `\n\nNOTE: This prompt has already been optimized ${iteration - 1} time(s). Apply further refinements — focus on areas that could still be improved. Do not undo previous optimizations. Be more aggressive with improvements.`;

  const userMessage = `PROMPT TO FURTHER OPTIMIZE (iteration ${iteration}):\n"""${prompt}"""`;
  const result = await generateJSON(systemPrompt, userMessage, OPTIMIZE_SCHEMA);

  const optimizedTokens = await countTokens(result.optimized);

  return {
    optimized: result.optimized,
    explanation: result.explanation,
    iteration,
    tokenCount: optimizedTokens,
  };
}

/**
 * Get the appropriate system prompt for a mode.
 */
function getSystemPrompt(mode, toneStyle) {
  if (mode === 'tone') {
    const toneKey = `tone_${toneStyle || 'formal'}`;
    if (!MODE_PROMPTS[toneKey]) {
      throw new AppError(
        `Unsupported tone style: "${toneStyle}". Use: formal, technical, creative.`,
        400,
        'INVALID_TONE'
      );
    }
    return MODE_PROMPTS[toneKey];
  }

  if (!MODE_PROMPTS[mode]) {
    throw new AppError(
      `Unsupported mode: "${mode}". Use: clarity, concise, reasoning, system_prompt, tone.`,
      400,
      'INVALID_MODE'
    );
  }

  return MODE_PROMPTS[mode];
}

// ═══════════════════════════════════════════════════════════
// STREAMING VARIANTS (SSE)
// ═══════════════════════════════════════════════════════════

/**
 * Optimize a prompt with streaming — streams raw text chunks via onChunk,
 * then returns the full structured result after the stream completes.
 */
export async function optimizePromptStream({ prompt, mode, toneStyle, preset, context }, onChunk) {
  // Build the system prompt
  let systemPrompt = getSystemPrompt(mode, toneStyle);

  // Append preset-specific instructions if provided
  if (preset && PRESET_INSTRUCTIONS[preset]) {
    systemPrompt += '\n\n' + PRESET_INSTRUCTIONS[preset];
  }

  // Build the user prompt with optional context
  let userMessage = `PROMPT TO OPTIMIZE:\n"""${prompt}"""`;
  if (context) {
    userMessage = `CONTEXT (use this to inform your optimization):\n"""${context}"""\n\n${userMessage}`;
  }

  // Call Gemini with streaming
  const result = await generateJSONStream(systemPrompt, userMessage, OPTIMIZE_SCHEMA, onChunk);

  // Count tokens (after stream completes)
  const [originalTokens, optimizedTokens] = await Promise.all([
    countTokens(prompt),
    countTokens(result.optimized),
  ]);

  // Estimate costs
  const cost = estimateCost(originalTokens, optimizedTokens);

  return {
    original: prompt,
    optimized: result.optimized,
    explanation: result.explanation,
    mode,
    preset: preset || null,
    tokenCount: {
      original: originalTokens,
      optimized: optimizedTokens,
    },
    estimatedCost: cost,
  };
}

/**
 * Re-optimize with streaming — streams raw text chunks via onChunk.
 */
export async function reOptimizeStream({ prompt, mode, toneStyle, iteration }, onChunk) {
  let systemPrompt = getSystemPrompt(mode, toneStyle);
  systemPrompt += `\n\nNOTE: This prompt has already been optimized ${iteration - 1} time(s). Apply further refinements — focus on areas that could still be improved. Do not undo previous optimizations. Be more aggressive with improvements.`;

  const userMessage = `PROMPT TO FURTHER OPTIMIZE (iteration ${iteration}):\n"""${prompt}"""`;
  const result = await generateJSONStream(systemPrompt, userMessage, OPTIMIZE_SCHEMA, onChunk);

  const optimizedTokens = await countTokens(result.optimized);

  return {
    optimized: result.optimized,
    explanation: result.explanation,
    iteration,
    tokenCount: optimizedTokens,
  };
}
