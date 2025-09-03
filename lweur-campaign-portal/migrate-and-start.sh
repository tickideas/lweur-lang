#!/bin/sh

# /Users/0xanyi/Developer/lweur-lang/lweur-campaign-portal/migrate-and-start.sh
# Production startup script with automated database migrations and safety checks
# Runs database migrations safely before starting the Next.js application
# RELEVANT FILES: Dockerfile, package.json, prisma/schema.prisma

set -e  # Exit on any error

echo "🚀 Starting Loveworld Europe Campaign Portal deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📊 Waiting for database to be ready..."

# Extract connection details from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:\/]*\)[:\/]\{1\}.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]\{2,5\}\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
DB_PORT=${DB_PORT:-5432}

RETRIES=${DB_CONNECT_RETRIES:-10}
SLEEP_SECONDS=${DB_CONNECT_SLEEP:-3}
i=0

if command -v pg_isready >/dev/null 2>&1; then
    echo "🔍 Checking Postgres at $DB_HOST:$DB_PORT (db=$DB_NAME)"
    while ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" >/dev/null 2>&1; do
        i=$((i+1))
        if [ "$i" -ge "$RETRIES" ]; then
            echo "❌ ERROR: Database not reachable after $RETRIES attempts"
            echo "   Host: $DB_HOST  Port: $DB_PORT  DB: $DB_NAME"
            echo "   Please verify DATABASE_URL and Coolify networking between services"
            exit 1
        fi
        echo "⏳ Database not ready yet, retry $i/$RETRIES..."
        sleep "$SLEEP_SECONDS"
    done
else
    # Fallback to Prisma CLI check if pg_isready is unavailable
    until npx prisma migrate status --schema=./prisma/schema.prisma >/dev/null 2>&1; do
        i=$((i+1))
        if [ "$i" -ge "$RETRIES" ]; then
            echo "❌ ERROR: Database not reachable after $RETRIES attempts"
            echo "   Please check your DATABASE_URL and ensure the database server is running"
            # Print last Prisma error for debugging
            npx prisma migrate status --schema=./prisma/schema.prisma || true
            exit 1
        fi
        echo "⏳ Database not ready yet, retry $i/$RETRIES..."
        sleep "$SLEEP_SECONDS"
    done
fi

echo "✅ Database reachable"

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

# Note: We do not run `prisma generate` here because the client
# is generated during the build phase. Running it at runtime can
# fail due to file permissions and is unnecessary in production.

# Optional: Seed database if needed
if [ "$RUN_SEED" = "true" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed 2>/dev/null || echo "⚠️  Seeding skipped (script not found or failed)"
fi

echo "🎉 Database setup complete, starting application..."

# Start the Next.js application
exec node server.js
