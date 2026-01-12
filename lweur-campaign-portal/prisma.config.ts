// Prisma configuration file for Prisma 7+
// See: https://pris.ly/prisma-config

import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  // Explicitly point to the schema
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),

  // Migrations-related settings
  migrations: {
    // Seed command switched to tsx for zero-config TS execution
    seed: 'tsx prisma/seed.ts',
  },

  // Database connection URL for Prisma 7+
  datasource: {
    url: process.env.DATABASE_URL || '',
  },
});
