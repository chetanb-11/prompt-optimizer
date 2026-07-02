import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest.js';
import { optimizePrompt, reOptimize, optimizePromptStream, reOptimizeStream } from '../services/optimizeService.js';

const router = Router();

// ── SSE Helper ─────────────────────────────────────────────
/**
 * Initialize an SSE response with proper headers.
 */
function initSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();
}

/**
 * Send an SSE event to the client.
 */
function sendSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// POST /api/optimize — Optimize a prompt
router.post(
  '/',
  validateBody([
    { field: 'prompt', type: 'string', required: true, maxLength: 50000 },
    { field: 'mode', type: 'string', required: true, enum: ['clarity', 'concise', 'reasoning', 'system_prompt', 'tone'] },
    { field: 'toneStyle', type: 'string', required: false, enum: ['formal', 'technical', 'creative'] },
    { field: 'preset', type: 'string', required: false, enum: ['chatgpt', 'claude', 'gemini', 'api_efficient', 'beginner'] },
    { field: 'context', type: 'string', required: false, maxLength: 100000 },
  ]),
  async (req, res, next) => {
    const wantsStream = req.body.stream === true || req.query.stream === 'true';

    // ── Streaming path ──
    if (wantsStream) {
      initSSE(res);

      try {
        const result = await optimizePromptStream(
          req.body,
          (chunk) => sendSSE(res, 'chunk', { text: chunk })
        );

        sendSSE(res, 'done', result);
      } catch (error) {
        const message = error.isOperational
          ? error.message
          : 'An unexpected error occurred. Please try again.';
        const code = error.code || 'INTERNAL_ERROR';

        sendSSE(res, 'error', { message, code, status: error.statusCode || 500 });
      } finally {
        res.end();
      }
      return;
    }

    // ── Non-streaming path (original) ──
    try {
      const result = await optimizePrompt(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/optimize/iterate — Re-optimize an already-optimized prompt
router.post(
  '/iterate',
  validateBody([
    { field: 'prompt', type: 'string', required: true, maxLength: 50000 },
    { field: 'mode', type: 'string', required: true, enum: ['clarity', 'concise', 'reasoning', 'system_prompt', 'tone'] },
    { field: 'toneStyle', type: 'string', required: false },
    { field: 'iteration', type: 'number', required: true },
  ]),
  async (req, res, next) => {
    const wantsStream = req.body.stream === true || req.query.stream === 'true';

    // ── Streaming path ──
    if (wantsStream) {
      initSSE(res);

      try {
        const result = await reOptimizeStream(
          req.body,
          (chunk) => sendSSE(res, 'chunk', { text: chunk })
        );

        sendSSE(res, 'done', result);
      } catch (error) {
        const message = error.isOperational
          ? error.message
          : 'An unexpected error occurred. Please try again.';
        const code = error.code || 'INTERNAL_ERROR';

        sendSSE(res, 'error', { message, code, status: error.statusCode || 500 });
      } finally {
        res.end();
      }
      return;
    }

    // ── Non-streaming path (original) ──
    try {
      const result = await reOptimize(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
