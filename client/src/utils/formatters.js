/**
 * Format a timestamp into a human-readable relative time or date.
 */
export function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Get mode display label.
 */
export const MODE_LABELS = {
  clarity: 'Improve Clarity',
  concise: 'Make Concise',
  reasoning: 'Add Reasoning',
  system_prompt: 'System Prompt',
  tone: 'Transform Tone',
};

/**
 * Get mode color class.
 */
export const MODE_COLORS = {
  clarity: 'text-blue-400',
  concise: 'text-emerald-400',
  reasoning: 'text-purple-400',
  system_prompt: 'text-amber-400',
  tone: 'text-pink-400',
};

/**
 * Get score color based on value.
 */
export function getScoreColor(score) {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 6) return 'text-blue-400';
  if (score >= 4) return 'text-amber-400';
  return 'text-red-400';
}

export function getScoreBg(score) {
  if (score >= 8) return 'bg-emerald-500';
  if (score >= 6) return 'bg-blue-500';
  if (score >= 4) return 'bg-amber-500';
  return 'bg-red-500';
}
