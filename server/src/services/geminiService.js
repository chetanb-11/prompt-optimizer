import { generateWithRetry, countWithDeadline } from './geminiRequests.js';
import { GoogleGenAI } from '@google/genai';
import { AppError } from '../middleware/errorHandler.js';
import dotenv from 'dotenv';

dotenv.config();

// ── Initialize Gemini Client ───────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-3.7-flash';

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
  const response = await generateWithRetry(
    async (model, signal) => {
      const res = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          abortSignal: signal,
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
  const response = await generateWithRetry(
    async (model, signal) => {
      const res = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          abortSignal: signal,
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
 * Generate a JSON-structured response from Gemini with streaming.
 * Streams text chunks via onChunk callback, then parses the full response as JSON.
 *
 * @param {string} systemPrompt - System instruction for the model
 * @param {string} userPrompt - User's input text
 * @param {object} schema - JSON schema for structured output
 * @param {Function} onChunk - Callback receiving each text chunk as it arrives
 * @param {object} [options] - Optional config overrides
 * @returns {Promise<object>} Parsed JSON response (after streaming completes)
 */
export async function generateJSONStream(systemPrompt, userPrompt, schema, onChunk, options = {}) {
  const response = await generateWithRetry(
    async (model, signal) => {
      const stream = await ai.models.generateContentStream({
        model,
        contents: userPrompt,
        config: {
          abortSignal: signal,
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 4096,
        },
      });

      let fullText = '';

      try {
        for await (const chunk of stream) {
          signal?.throwIfAborted();
          const text = chunk.text || '';
          if (text) {
            fullText += text;
            onChunk(text);
          }
        }
      } catch (error) {
        signal?.throwIfAborted();
        if (!fullText) throw error;
        throw new AppError('Stream interrupted. Please try again.', 502, 'STREAM_INTERRUPTED');
      }

      if (!fullText) {
        throw new AppError('Empty response from AI model.', 502, 'EMPTY_RESPONSE');
      }

      return JSON.parse(fullText);
    },
    options.model || MODEL
  );

  return response;
}

/**
 * Count tokens for a given text using the Gemini API.
 */
export function countTokens(text) {
  return countWithDeadline(ai.models, MODEL, text);
}
