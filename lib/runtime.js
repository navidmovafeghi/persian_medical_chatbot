// Runtime configuration for Prisma and Other dependencies in serverless environments
export const runtime = 'nodejs';

// Adding this ensures that the Prisma client is properly initialized in serverless environments
// No need to actually put code in this file, just the runtime specification is enough
// This file can be imported in API routes if needed 