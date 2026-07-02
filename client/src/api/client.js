import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000, // 60s — LLM calls can be slow
  headers: { 'Content-Type': 'application/json' },
});

// ── Response Interceptor ─────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    const code = error.response?.data?.code || 'UNKNOWN';

    // Show toast for user-facing errors
    if (code === 'RATE_LIMIT' || code === 'RATE_LIMIT_EXCEEDED') {
      toast.error('Rate limited — please wait a moment and retry.');
    } else if (code === 'AUTH_ERROR') {
      toast.error('API key issue — check your Gemini API key.');
    } else if (code === 'VALIDATION_ERROR') {
      toast.error(message);
    } else {
      toast.error(message);
    }

    return Promise.reject({ message, code, status: error.response?.status });
  }
);

// ── API Methods ──────────────────────────────────────────

export const optimizePrompt = (data) => api.post('/optimize', data);
export const reOptimizePrompt = (data) => api.post('/optimize/iterate', data);
export const scorePrompt = (prompt) => api.post('/score', { prompt });
export const comparePrompts = (data) => api.post('/compare', data);
export const convertPrompt = (data) => api.post('/convert', data);
export const executeChain = (data) => api.post('/chain', data);
export const healthCheck = () => api.get('/health');

// ── Streaming API Methods (SSE via fetch) ────────────────

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Parse a raw SSE text buffer and extract complete events.
 * Returns { events: [{event, data}], remaining: string }
 */
function parseSSEBuffer(buffer) {
  const events = [];
  const lines = buffer.split('\n');
  let currentEvent = null;
  let currentData = null;
  let remaining = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7);
    } else if (line.startsWith('data: ')) {
      currentData = line.slice(6);
    } else if (line === '' && currentEvent && currentData) {
      // Empty line = end of event
      try {
        events.push({ event: currentEvent, data: JSON.parse(currentData) });
      } catch {
        events.push({ event: currentEvent, data: currentData });
      }
      currentEvent = null;
      currentData = null;
    } else if (line === '' && !currentEvent && !currentData) {
      // Skip double empty lines
    } else {
      // Incomplete event at end of buffer — preserve for next iteration
      remaining = lines.slice(i).join('\n');
      return { events, remaining };
    }
  }

  // If we have a partial event at the end, preserve it
  if (currentEvent || currentData) {
    const parts = [];
    if (currentEvent) parts.push(`event: ${currentEvent}`);
    if (currentData) parts.push(`data: ${currentData}`);
    remaining = parts.join('\n');
  }

  return { events, remaining };
}

/**
 * Consume an SSE stream from a fetch response.
 * Calls onChunk(text) for each chunk event, onDone(result) when complete.
 */
async function consumeSSEStream(response, { onChunk, onDone, onError }) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { events, remaining } = parseSSEBuffer(buffer);
      buffer = remaining;

      for (const { event, data } of events) {
        if (event === 'chunk') {
          onChunk?.(data.text);
        } else if (event === 'done') {
          onDone?.(data);
        } else if (event === 'error') {
          const msg = data.message || 'Streaming error occurred.';
          onError?.({ message: msg, code: data.code, status: data.status });
        }
      }
    }
  } catch (err) {
    onError?.({ message: err.message || 'Stream connection lost.', code: 'STREAM_ERROR' });
  }
}

/**
 * Optimize a prompt with SSE streaming.
 * @param {object} data - Request body (prompt, mode, etc.)
 * @param {object} callbacks - { onChunk, onDone, onError }
 * @returns {AbortController} Controller to cancel the stream
 */
export function optimizePromptStream(data, { onChunk, onDone, onError }) {
  const controller = new AbortController();

  fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, stream: true }),
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw err;
        });
      }
      return consumeSSEStream(response, { onChunk, onDone, onError });
    })
    .catch((err) => {
      if (err.name === 'AbortError') return; // User cancelled
      onError?.({
        message: err.message || 'Failed to connect to optimization service.',
        code: err.code || 'NETWORK_ERROR',
      });
    });

  return controller;
}

/**
 * Re-optimize a prompt with SSE streaming.
 */
export function reOptimizePromptStream(data, { onChunk, onDone, onError }) {
  const controller = new AbortController();

  fetch(`${API_BASE}/optimize/iterate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, stream: true }),
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw err;
        });
      }
      return consumeSSEStream(response, { onChunk, onDone, onError });
    })
    .catch((err) => {
      if (err.name === 'AbortError') return;
      onError?.({
        message: err.message || 'Failed to connect to optimization service.',
        code: err.code || 'NETWORK_ERROR',
      });
    });

  return controller;
}

export default api;

