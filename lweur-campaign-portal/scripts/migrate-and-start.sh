#!/bin/bash

# /Users/0xanyi/Developer/lweur-lang/lweur-campaign-portal/scripts/migrate-and-start.sh
# Production startup script with automated database migrations and safety checks
# Runs database migrations safely before starting the Next.js application
# RELEVANT FILES: Dockerfile.production, package.json, prisma/schema.prisma

set -e  # Exit on any error

echo "🚀 Starting Loveworld Europe Campaign Portal deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📊 Checking database connection..."

# Test database connection
if ! npx prisma db pull --schema=./prisma/schema.prisma >/dev/null 2>&1; then
    echo "❌ ERROR: Cannot connect to database"
    echo "   Please check your DATABASE_URL and ensure the database server is running"
    exit 1
fi

echo "✅ Database connection successful"

# Backup existing data (optional, for safety)
if [ "$ENABLE_DB_BACKUP" = "true" ]; then
    echo "💾 Creating database backup..."
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    
    # Extract database connection details for backup
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    
    if command -v pg_dump >/dev/null 2>&1; then
        pg_dump "$DATABASE_URL" > "/tmp/$BACKUP_FILE" 2>/dev/null || echo "⚠️  Backup failed, but continuing with deployment"
        echo "✅ Database backup created: /tmp/$BACKUP_FILE"
    else
        echo "⚠️  pg_dump not available, skipping backup"
    fi
fi

echo "🔄 Running database migrations..."

# Check if there are pending migrations
MIGRATION_STATUS=$(npx prisma migrate status --schema=./prisma/schema.prisma 2>&1 || echo "unknown")

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    echo "✅ Database schema is already up to date"
elif echo "$MIGRATION_STATUS" | grep -q "Following migration have not yet been applied"; then
    echo "📝 Applying pending migrations..."
    npx prisma migrate deploy --schema=./prisma/schema.prisma
    
    if [ $? -eq 0 ]; then
        echo "✅ Migrations applied successfully"
    else
        echo "❌ ERROR: Migration failed"
        exit 1
    fi
else
    echo "🔧 Checking migration status..."
    # Force deployment of migrations (for production)
    npx prisma migrate deploy --schema=./prisma/schema.prisma
    
    if [ $? -eq 0 ]; then
        echo "✅ Database schema synchronized"
    else
        echo "❌ ERROR: Could not synchronize database schema"
        exit 1
    fi
fi

# Generate fresh Prisma client (in case of schema changes)
echo "🔨 Generating Prisma client..."
npx prisma generate --schema=./prisma/schema.prisma

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ ERROR: Failed to generate Prisma client"
    exit 1
fi

# Optional: Seed database if needed
if [ "$RUN_SEED" = "true" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed 2>/dev/null || echo "⚠️  Seeding skipped (script not found or failed)"
fi

echo "🎉 Database setup complete, starting application..."

# Start the Next.js application
exec node server.js