/**
 * Client-side token estimation (~4 chars per token for English text).
 * This is a rough heuristic — the backend uses Gemini's countTokens for accuracy.
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function countWords(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function countChars(text) {
  if (!text) return 0;
  return text.length;
}
