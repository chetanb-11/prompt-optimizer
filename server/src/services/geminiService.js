import { GoogleGenAI } from '@google/genai';
import { AppError } from '../middleware/errorHandler.js';
import dotenv from 'dotenv';

dotenv.config();

// ── Initialize Gemini Client ───────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-2.5-flash';

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
  try {
    const response = await ai.models.generateContent({
      model: options.model || MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4096,
      },
    });

    const text = response.text;
    if (!text) {
      throw new AppError('Empty response from AI model.', 502, 'EMPTY_RESPONSE');
    }

    return JSON.parse(text);
  } catch (error) {
    // Re-throw our own errors
    if (error instanceof AppError) throw error;

    // Handle specific Gemini API errors
    const status = error?.status || error?.httpStatusCode;
    if (status === 429) {
      throw new AppError(
        'AI rate limit exceeded. Please wait a moment and try again.',
        429,
        'RATE_LIMIT'
      );
    }
    if (status === 403 || status === 401) {
      throw new AppError(
        'API key is invalid or quota exceeded. Check your Gemini API key.',
        403,
        'AUTH_ERROR'
      );
    }
    if (status === 400) {
      throw new AppError(
        'Invalid request to AI model. The prompt may be too long or contain unsupported content.',
        400,
        'BAD_REQUEST'
      );
    }

    console.error('Gemini API Error:', error?.message || error);
    throw new AppError(
      'AI service is temporarily unavailable. Please try again.',
      503,
      'AI_UNAVAILABLE'
    );
  }
}

/**
 * Generate plain text response from Gemini (no JSON schema).
 */
export async function generateText(systemPrompt, userPrompt, options = {}) {
  try {
    const response = await ai.models.generateContent({
      model: options.model || MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4096,
      },
    });

    return response.text || '';
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Gemini API Error:', error?.message || error);
    throw new AppError('AI service is temporarily unavailable.', 503, 'AI_UNAVAILABLE');
  }
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
