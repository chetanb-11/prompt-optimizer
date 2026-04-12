import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest.js';
import { executeChain } from '../services/chainService.js';

const router = Router();

// POST /api/chain — Execute a multi-step optimization chain
router.post(
  '/',
  validateBody([
    { field: 'prompt', type: 'string', required: true, maxLength: 50000 },
    { field: 'steps', type: 'array', required: true },
  ]),
  async (req, res, next) => {
    try {
      const result = await executeChain(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
