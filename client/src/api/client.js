import { consumeSSEStream } from './stream.js';
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
      return consumeSSEStream(response, { onChunk, onDone, onError }, controller.signal);
    })
    .catch((err) => {
      if (controller.signal.aborted || err.name === 'AbortError') {
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
      return consumeSSEStream(response, { onChunk, onDone, onError }, controller.signal);
    })
    .catch((err) => {
      if (controller.signal.aborted || err.name === 'AbortError') {
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
