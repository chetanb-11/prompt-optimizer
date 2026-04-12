import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest.js';
import { scorePrompt } from '../services/scoreService.js';

const router = Router();

// POST /api/score — Score a prompt
router.post(
  '/',
  validateBody([
    { field: 'prompt', type: 'string', required: true, maxLength: 50000 },
  ]),
  async (req, res, next) => {
    try {
      const result = await scorePrompt(req.body.prompt);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
