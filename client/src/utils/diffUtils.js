import { diffWords } from 'diff';

/**
 * Generate a diff between original and optimized text.
 * Returns an array of { value, added, removed } parts.
 */
export function computeDiff(original, optimized) {
  if (!original || !optimized) return [];
  return diffWords(original, optimized);
}

/**
 * Calculate diff statistics.
 */
export function diffStats(original, optimized) {
  const parts = computeDiff(original, optimized);

  let added = 0;
  let removed = 0;
  let unchanged = 0;

  parts.forEach((part) => {
    const words = part.value.split(/\s+/).filter(Boolean).length;
    if (part.added) added += words;
    else if (part.removed) removed += words;
    else unchanged += words;
  });

  return { added, removed, unchanged, total: added + removed + unchanged };
}
