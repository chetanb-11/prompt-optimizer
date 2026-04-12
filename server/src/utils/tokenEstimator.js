/**
 * Token cost estimation utilities.
 * Gemini 2.5 Flash pricing (as of April 2026):
 *   Input:  $0.30 per 1M tokens
 *   Output: $2.50 per 1M tokens
 */

const PRICING = {
  'gemini-2.5-flash': {
    input: 0.30 / 1_000_000,   // $0.00000030 per token
    output: 2.50 / 1_000_000,  // $0.00000250 per token
  },
  'gemini-2.5-pro': {
    input: 1.25 / 1_000_000,
    output: 10.0 / 1_000_000,
  },
  'gemini-2.5-flash-lite': {
    input: 0.10 / 1_000_000,
    output: 0.40 / 1_000_000,
  },
};

/**
 * Estimate the cost of a Gemini API call.
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @param {string} model - Model name (default: gemini-2.5-flash)
 * @returns {{ inputCost: string, outputCost: string, totalCost: string }}
 */
export function estimateCost(inputTokens, outputTokens, model = 'gemini-2.5-flash') {
  const pricing = PRICING[model] || PRICING['gemini-2.5-flash'];

  const inputCost = inputTokens * pricing.input;
  const outputCost = outputTokens * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    inputCost: `$${inputCost.toFixed(6)}`,
    outputCost: `$${outputCost.toFixed(6)}`,
    totalCost: `$${totalCost.toFixed(6)}`,
    model,
  };
}

/**
 * Rough token estimate from text length (~4 chars per token).
 */
export function roughTokenCount(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
