import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000, // 60s — LLM calls can be slow
  headers: { 'Content-Type': 'application/json' },
});

// ── Client-Side Validation ───────────────────────────────
/**
 * Validate that a prompt payload has a non-empty prompt string.
 * Returns an error message string if invalid, or null if valid.
 */
function validatePromptPayload(data) {
  if (!data || typeof data.prompt !== 'string' || !data.prompt.trim()) {
    return 'Prompt cannot be empty.';
  }
  if (data.prompt.length > 50000) {
    return 'Prompt exceeds maximum length of 50,000 characters.';
  }
  return null;
}

// ── Fetch with Retry (for streaming endpoints) ──────────
const STREAM_MAX_RETRIES = 3;
const STREAM_BASE_DELAY_MS = 2000; // 2s, 4s, 8s

/**
 * Fetch with automatic retry on 503 (overload) and 429 (rate limit).
 * Uses exponential backoff. Only retries before the stream body is consumed.
 */
async function fetchWithRetry(url, options, maxRetries = STREAM_MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If the server returned a retryable status, throw to trigger retry
      if ((response.status === 503 || response.status === 429) && attempt < maxRetries) {
        const delay = STREAM_BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `⚠ API returned ${response.status} (attempt ${attempt + 1}/${maxRetries + 1}). ` +
          `Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;

      // Don't retry user-initiated aborts
      if (error.name === 'AbortError') throw error;

      // Network errors — retry with backoff
      if (attempt < maxRetries) {
        const delay = STREAM_BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `⚠ Network error (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}. ` +
          `Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError;
}

// ── Response Interceptor ─────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code || 'UNKNOWN';
    let message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    // Graceful "service busy" handling during occasional crowd traffic
    if (status === 503 || code === 'AI_OVERLOADED' || code === 'AI_UNAVAILABLE') {
      message = 'AI servers are momentarily busy handling requests. Please wait a few seconds and try again.';
      toast.error(message, { id: 'service-busy', duration: 5000, icon: '⚡' });
    } else if (status === 429 || code === 'RATE_LIMIT' || code === 'RATE_LIMIT_EXCEEDED') {
      message = 'Request limit reached. Please wait 30 seconds before retrying.';
      toast.error(message, { id: 'rate-limit', duration: 5000, icon: '⏳' });
    } else if (code === 'AUTH_ERROR' || status === 403 || status === 401) {
      toast.error('API key issue — please check your Gemini API key in server/.env.', { id: 'auth-error', duration: 5000 });
    } else if (code === 'VALIDATION_ERROR') {
      toast.error(message);
    } else if (error.code === 'ECONNABORTED' || message?.toLowerCase().includes('timeout')) {
      toast.error('Request timed out. The server or AI model is currently slow — please retry.', { id: 'timeout-error', duration: 5000 });
    } else if (!error.response && error.request) {
      toast.error('Cannot reach backend server. It may still be waking up — please wait a moment.', { id: 'network-error', duration: 5000 });
    } else {
      toast.error(message);
    }

    return Promise.reject({ message, code, status });
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
          const isBusy = data.status === 503 || data.status === 429 || data.code === 'AI_OVERLOADED' || data.code === 'RATE_LIMIT_EXCEEDED';
          const msg = isBusy
            ? 'AI servers are momentarily busy handling requests. Please wait a few moments and try again.'
            : (data.message || 'Streaming error occurred.');
          onError?.({ message: msg, code: data.code, status: data.status });
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError' || err.message?.toLowerCase().includes('abort') || err.message?.toLowerCase().includes('cancel')) {
      return; // Silent return on user-initiated cancellation
    }
    onError?.({ message: err.message || 'Stream connection lost.', code: 'STREAM_ERROR' });
  }
}

/**
 * Optimize a prompt with SSE streaming.
 * Validates input client-side and retries on 503/429 before consuming the stream.
 *
 * @param {object} data - Request body (prompt, mode, etc.)
 * @param {object} callbacks - { onChunk, onDone, onError }
 * @returns {AbortController} Controller to cancel the stream
 */
export function optimizePromptStream(data, { onChunk, onDone, onError }) {
  const controller = new AbortController();

  // Client-side validation — catch empty prompts before hitting the network
  const validationError = validatePromptPayload(data);
  if (validationError) {
    // Defer to next microtask so the caller gets the AbortController back first
    Promise.resolve().then(() => {
      onError?.({ message: validationError, code: 'VALIDATION_ERROR' });
    });
    return controller;
  }

  fetchWithRetry(
    `${API_BASE}/optimize`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, stream: true }),
      signal: controller.signal,
    }
  )
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw err;
        });
      }
      return consumeSSEStream(response, { onChunk, onDone, onError });
    })
    .catch((err) => {
      if (err.name === 'AbortError' || err.message?.toLowerCase().includes('abort') || err.message?.toLowerCase().includes('cancel')) {
        return; // User cancelled
      }
      const isBusy = err.status === 503 || err.status === 429 || err.code === 'AI_OVERLOADED' || err.code === 'RATE_LIMIT_EXCEEDED';
      const message = isBusy
        ? 'AI servers are momentarily busy handling requests. Please wait a few moments and try again.'
        : (err.message || 'Failed to connect to optimization service.');
      onError?.({
        message,
        code: err.code || 'NETWORK_ERROR',
      });
    });

  return controller;
}

/**
 * Re-optimize a prompt with SSE streaming.
 * Validates input client-side and retries on 503/429 before consuming the stream.
 */
export function reOptimizePromptStream(data, { onChunk, onDone, onError }) {
  const controller = new AbortController();

  // Client-side validation
  const validationError = validatePromptPayload(data);
  if (validationError) {
    Promise.resolve().then(() => {
      onError?.({ message: validationError, code: 'VALIDATION_ERROR' });
    });
    return controller;
  }

  fetchWithRetry(
    `${API_BASE}/optimize/iterate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, stream: true }),
      signal: controller.signal,
    }
  )
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw err;
        });
      }
      return consumeSSEStream(response, { onChunk, onDone, onError });
    })
    .catch((err) => {
      if (err.name === 'AbortError' || err.message?.toLowerCase().includes('abort') || err.message?.toLowerCase().includes('cancel')) {
        return;
      }
      const isBusy = err.status === 503 || err.status === 429 || err.code === 'AI_OVERLOADED' || err.code === 'RATE_LIMIT_EXCEEDED';
      const message = isBusy
        ? 'AI servers are momentarily busy handling requests. Please wait a few moments and try again.'
        : (err.message || 'Failed to connect to optimization service.');
      onError?.({
        message,
        code: err.code || 'NETWORK_ERROR',
      });
    });

  return controller;
}

export default api;
