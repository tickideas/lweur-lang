// Prisma configuration file to replace deprecated package.json#prisma
// See: https://pris.ly/prisma-config

import { defineConfig } from '@prisma/config';

export default defineConfig({
  // Explicitly point to the schema
  schema: './prisma/schema.prisma',

  // Migrations-related settings
  migrations: {
    // Seed command switched to tsx for zero-config TS execution
    seed: "tsx prisma/seed.ts",
  },
});
