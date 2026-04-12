import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import optimizeRoutes from './routes/optimize.js';
import scoreRoutes from './routes/score.js';
import compareRoutes from './routes/compare.js';
import convertRoutes from './routes/convert.js';
import chainRoutes from './routes/chain.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

// ── Routes ─────────────────────────────────────────────────
app.use('/api/optimize', optimizeRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/chain', chainRoutes);

// ── Health Check ───────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'PromptForge API'});
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ── Error Handler (must be last) ───────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚡ PromptForge API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
