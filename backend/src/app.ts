import express from 'express';
import cors from 'cors';
import { config } from './config';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import workflowRoutes from './routes/workflows.routes';
import webhookRoutes from './routes/webhook.routes';
import executionRoutes from './routes/executions.routes';

export function createApp() {
  const app = express();

  // ─── Core Middleware ──────────────────────────────────────────────────────
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  // ─── Health Check ─────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── Routes ───────────────────────────────────────────────────────────────
  app.use('/api/workflows', workflowRoutes);
  app.use('/api/webhook', webhookRoutes);
  app.use('/api', executionRoutes);

  // ─── Global Error Handler (must be last) ──────────────────────────────────
  app.use(errorHandler);

  return app;
}
