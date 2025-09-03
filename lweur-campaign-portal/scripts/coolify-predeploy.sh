#!/bin/bash

# /Users/0xanyi/Developer/lweur-lang/lweur-campaign-portal/scripts/coolify-predeploy.sh
# Coolify pre-deployment hook for database migrations
# Runs automatically before each deployment via Coolify's hook system
# RELEVANT FILES: package.json, prisma/schema.prisma

set -e

echo "🔄 Pre-deployment: Running database migrations..."

# Check if DATABASE_URL is available
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not found"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "📊 Deploying migrations..."
npx prisma migrate deploy

echo "✅ Pre-deployment migrations completed successfully"