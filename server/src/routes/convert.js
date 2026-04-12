import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest.js';
import { convertPrompt } from '../services/convertService.js';

const router = Router();

// POST /api/convert — Convert prompt format
router.post(
  '/',
  validateBody([
    { field: 'prompt', type: 'string', required: true, maxLength: 50000 },
    { field: 'format', type: 'string', required: true, enum: ['json', 'chat', 'api'] },
  ]),
  async (req, res, next) => {
    try {
      const result = await convertPrompt(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
