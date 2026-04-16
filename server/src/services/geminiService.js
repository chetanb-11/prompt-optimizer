import { GoogleGenAI } from '@google/genai';
import { AppError } from '../middleware/errorHandler.js';
import dotenv from 'dotenv';

dotenv.config();

// ── Initialize Gemini Client ───────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash';

// ── Retry Configuration ───────────────────────────────────
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s exponential backoff

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

/**
 * Execute a Gemini API call with retry logic and automatic fallback.
 *
 * Retries on 503 (overloaded) and 429 (rate limit) errors with
 * exponential backoff. After exhausting retries on the primary model,
 * attempts one final call using the fallback model.
 *
 * @param {Function} apiFn - Async function that takes a model name and returns the API response
 * @param {string} primaryModel - Primary model to use
 * @returns {Promise<any>} The API response
 */
async function callWithRetry(apiFn, primaryModel) {
  let lastError;

  // ── Try primary model with retries ──
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await apiFn(primaryModel);
    } catch (error) {
      lastError = error;
      if (error instanceof AppError) throw error;

      if (isRetryable(error) && attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `⚠ Gemini API returned ${error?.status} (attempt ${attempt + 1}/${MAX_RETRIES}). ` +
          `Retrying in ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }
    }
  }

  // ── Fallback to secondary model ──
  if (primaryModel !== FALLBACK_MODEL) {
    try {
      console.warn(`⚠ Primary model (${primaryModel}) failed. Falling back to ${FALLBACK_MODEL}...`);
      return await apiFn(FALLBACK_MODEL);
    } catch (fallbackError) {
      console.error('Fallback model also failed:', fallbackError?.message);
      // Fall through to throw the original error
    }
  }

  // ── All attempts exhausted ──
  console.error('Gemini API Error (all retries exhausted):', lastError?.message || lastError);
  throw classifyGeminiError(lastError);
}

/**
 * Generate a JSON-structured response from Gemini.
 * Uses structured output (responseJsonSchema) to guarantee parseable JSON.
 *
 * @param {string} systemPrompt - System instruction for the model
 * @param {string} userPrompt - User's input text
 * @param {object} schema - JSON schema for structured output
 * @param {object} [options] - Optional config overrides
 * @returns {Promise<object>} Parsed JSON response
 */
export async function generateJSON(systemPrompt, userPrompt, schema, options = {}) {
  const response = await callWithRetry(
    async (model) => {
      const res = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 4096,
        },
      });

      const text = res.text;
      if (!text) {
        throw new AppError('Empty response from AI model.', 502, 'EMPTY_RESPONSE');
      }

      return JSON.parse(text);
    },
    options.model || MODEL
  );

  return response;
}

/**
 * Generate plain text response from Gemini (no JSON schema).
 */
export async function generateText(systemPrompt, userPrompt, options = {}) {
  const response = await callWithRetry(
    async (model) => {
      const res = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 4096,
        },
      });

      return res.text || '';
    },
    options.model || MODEL
  );

  return response;
}

/**
 * Count tokens for a given text using the Gemini API.
 */
export async function countTokens(text) {
  try {
    const response = await ai.models.countTokens({
      model: MODEL,
      contents: text,
    });
    return response.totalTokens;
  } catch (error) {
    console.error('Token count error:', error?.message);
    // Fallback: rough estimate (~4 chars per token)
    return Math.ceil(text.length / 4);
  }
}
