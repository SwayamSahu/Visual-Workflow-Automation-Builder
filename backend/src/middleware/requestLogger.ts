import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';

export const requestLogger = pinoHttp({
  logger,
  // Don't log health check noise
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
});
