// Prisma configuration file to replace deprecated package.json#prisma
// See: https://pris.ly/prisma-config

import { defineConfig } from '@prisma/config';

export default defineConfig({
  // Explicitly point to the schema
  schema: './prisma/schema.prisma',

  // Migrations-related settings
  migrations: {
    // Seed command previously defined in package.json#prisma.seed
    // Keep ts-node here since seed.ts is TypeScript
    seed: "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
  },
});

