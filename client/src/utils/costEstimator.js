/**
 * Client-side cost estimation using Gemini pricing.
 */
const PRICING = {
  'gemini-2.5-flash': { input: 0.30, output: 2.50 },
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gemini-2.5-flash-lite': { input: 0.10, output: 0.40 },
};

export function estimateCost(inputTokens, outputTokens, model = 'gemini-2.5-flash') {
  const p = PRICING[model] || PRICING['gemini-2.5-flash'];
  const inputCost = (inputTokens / 1_000_000) * p.input;
  const outputCost = (outputTokens / 1_000_000) * p.output;
  return {
    input: formatCost(inputCost),
    output: formatCost(outputCost),
    total: formatCost(inputCost + outputCost),
  };
}

function formatCost(cost) {
  if (cost < 0.01) return `$${cost.toFixed(6)}`;
  return `$${cost.toFixed(4)}`;
}

export const MODEL_INFO = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', input: '$0.30', output: '$2.50' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', input: '$1.25', output: '$10.00' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', input: '$0.10', output: '$0.40' },
];
