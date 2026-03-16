import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// Prevent multiple PrismaClient instances in development (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      config.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (config.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
