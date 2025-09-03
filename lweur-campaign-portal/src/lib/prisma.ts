import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const logLevels: ('query' | 'info' | 'warn' | 'error')[] =
  process.env.NODE_ENV === 'production'
    ? ['warn', 'error']
    : ['query', 'warn', 'error'];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevels,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
