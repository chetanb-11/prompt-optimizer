import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest.js';
import { optimizePrompt, reOptimize } from '../services/optimizeService.js';

const router = Router();

// POST /api/optimize — Optimize a prompt
router.post(
  '/',
  validateBody([
    { field: 'prompt', type: 'string', required: true, maxLength: 50000 },
    { field: 'mode', type: 'string', required: true, enum: ['clarity', 'concise', 'reasoning', 'system_prompt', 'tone'] },
    { field: 'toneStyle', type: 'string', required: false, enum: ['formal', 'technical', 'creative'] },
    { field: 'preset', type: 'string', required: false, enum: ['chatgpt', 'claude', 'api_efficient', 'beginner'] },
    { field: 'context', type: 'string', required: false, maxLength: 100000 },
  ]),
  async (req, res, next) => {
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
    try {
      const result = await reOptimize(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
