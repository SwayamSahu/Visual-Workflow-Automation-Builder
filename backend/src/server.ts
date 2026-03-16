import 'dotenv/config'; // must be first — loads .env before any other import reads process.env
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './db/client';
import { registerNodes } from './registerNodes';

async function bootstrap(): Promise<void> {
  // 1. Register all node handlers before anything else
  registerNodes();
  logger.info('Node handlers registered');

  // 2. Verify DB connection
  await prisma.$connect();
  logger.info('Database connected');

  // 3. Start HTTP server
  const app = createApp();

  const server = app.listen(config.PORT, () => {
    logger.info(
      { port: config.PORT, env: config.NODE_ENV, aiProvider: config.AI_PROVIDER },
      '🚀 Server started'
    );
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Server and DB connection closed');
      process.exit(0);
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal: failed to start server', err);
  process.exit(1);
});
