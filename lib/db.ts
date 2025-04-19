import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.

declare global {
  var prisma: PrismaClient | undefined;
}

// Ensure the Prisma instance is initialized only once for a given deployment
export const prisma = globalThis.prisma || new PrismaClient();

// In development, attach to global to preserve across hot-reloads
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma; 