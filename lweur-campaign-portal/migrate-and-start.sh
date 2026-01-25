#!/bin/sh
set -e

# Validate DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "Starting application..."
exec node server.js
