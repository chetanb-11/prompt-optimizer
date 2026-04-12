import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest.js';
import { comparePrompts } from '../services/compareService.js';

const router = Router();

// POST /api/compare — Generate multiple optimized variants
router.post(
  '/',
  validateBody([
    { field: 'prompt', type: 'string', required: true, maxLength: 50000 },
    { field: 'variants', type: 'number', required: false },
    { field: 'mode', type: 'string', required: false, enum: ['clarity', 'concise', 'reasoning', 'system_prompt', 'tone'] },
  ]),
  async (req, res, next) => {
    try {
      const result = await comparePrompts({
        prompt: req.body.prompt,
        variants: Math.min(req.body.variants || 3, 5),
        mode: req.body.mode || 'clarity',
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
