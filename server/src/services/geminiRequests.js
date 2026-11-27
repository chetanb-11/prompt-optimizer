import { setTimeout as delayWithSignal } from 'node:timers/promises';
import { AppError } from '../middleware/errorHandler.js';
import { logModelEvent, recordModelTiming, requestSignal } from '../middleware/requestDiagnostics.js';
import { roughTokenCount } from '../utils/tokenEstimator.js';

const FALLBACK_MODEL = 'gemini-2.5-flash';

// ── Retry Configuration ───────────────────────────────────
const MAX_ATTEMPTS = 4;
const TOKEN_COUNT_TIMEOUT_MS = 2000;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s, 8s exponential backoff

/**
 * Sleep for a specified duration.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine if an error is retryable (503 overloaded, 429 rate limit).
 */
function isRetryable(error) {
  const status = error?.status || error?.httpStatusCode;
  return status === 503 || status === 429;
}

/**
 * Classify a Gemini API error into an AppError with the correct status/code.
 */
function classifyGeminiError(error) {
  const status = error?.status || error?.httpStatusCode;

  if (status === 408 || status === 504 || error?.name === 'TimeoutError') {
    return new AppError('AI request timed out. Please try again.', 504, 'AI_TIMEOUT');
  }
  if (status === 429) {
    return new AppError(
      'AI rate limit exceeded. Please wait a moment and try again.',
      429,
      'RATE_LIMIT'
    );
  }
  if (status === 403 || status === 401) {
    return new AppError(
      'API key is invalid or quota exceeded. Check your Gemini API key.',
      403,
      'AUTH_ERROR'
    );
  }
  if (status === 400) {
    return new AppError(
      'Invalid request to AI model. The prompt may be too long or contain unsupported content.',
      400,
      'BAD_REQUEST'
    );
  }
  if (status === 503) {
    return new AppError(
      'AI model is experiencing high demand. Please try again in a few seconds.',
      503,
      'AI_OVERLOADED'
    );
  }

  return new AppError(
    'AI service is temporarily unavailable. Please try again.',
    503,
    'AI_UNAVAILABLE'
  );
}

async function withSignal(signal, run) {
  if (!signal) return run();
  signal.throwIfAborted();
  let onAbort;
  const aborted = new Promise((_, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    return await Promise.race([run(), aborted]);
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
}

export async function generateWithRetry(apiFn, primaryModel, signal = requestSignal()) {
  const started = performance.now();
  try {
    return await withSignal(signal, () => attemptGeneration(apiFn, primaryModel, signal));
  } finally {
    recordModelTiming('generation', started);
  }
}

async function attemptGeneration(apiFn, primaryModel, signal) {
  for (let attempt = 1; ; attempt++) {
    signal?.throwIfAborted();
    try {
      return await apiFn(primaryModel, signal);
    } catch (error) {
      signal?.throwIfAborted();
      if (error instanceof AppError) throw error;
      const status = error?.status || error?.httpStatusCode;
      if (isRetryable(error) && attempt < MAX_ATTEMPTS) {
        const delay = BASE_DELAY_MS * 2 ** (attempt - 1) * (0.75 + Math.random() * 0.5);
        logModelEvent('model_retry', primaryModel, error);
        if (signal) await delayWithSignal(Math.round(delay), undefined, { signal });
        else await sleep(Math.round(delay));
        continue;
      }

      // A missing model can use the fallback immediately. Retrying invalid
      // input or credentials would send the same failing request again.
      const canFallback = status === 404 || status === 408 || status === 429 || status >= 500 || error?.name === 'TimeoutError';
      if (!canFallback || primaryModel === FALLBACK_MODEL) {
        logModelEvent('model_failed', primaryModel, error);
        throw classifyGeminiError(error);
      }
      logModelEvent('model_fallback', FALLBACK_MODEL, error);
      break;
    }
  }
  try {
    return await apiFn(FALLBACK_MODEL, signal);
  } catch (error) {
    logModelEvent('fallback_failed', FALLBACK_MODEL, error);
    throw error instanceof AppError ? error : classifyGeminiError(error);
  }
}

export async function countWithDeadline(models, model, text, request = requestSignal()) {
  const started = performance.now();
  const controller = new AbortController();
  const signal = request ? AbortSignal.any([request, controller.signal]) : controller.signal;
  const timer = setTimeout(() => controller.abort(), TOKEN_COUNT_TIMEOUT_MS);
  try {
    const response = await withSignal(signal, () =>
      models.countTokens({ model, contents: text, config: { abortSignal: signal } })
    );
    return response.totalTokens ?? roughTokenCount(text);
  } catch (error) {
    request?.throwIfAborted();
    logModelEvent(controller.signal.aborted ? 'token_count_timeout' : 'token_count_failed', model, error);
    return roughTokenCount(text);
  } finally {
    clearTimeout(timer);
    recordModelTiming('token_count', started);
  }
}
