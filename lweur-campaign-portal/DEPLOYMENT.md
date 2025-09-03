# Automated Database Migration Setup

This document explains how to set up automated database migrations for your Loveworld Europe Campaign Portal deployment.

## 🎯 Overview

We've created three automated migration approaches for your Coolify deployment:

1. **Docker-based migrations** (Recommended)
2. **GitHub Actions CI/CD** 
3. **Coolify hooks**

## 🔧 Setup Instructions

### Option 1: Docker-based Migrations (Recommended)

This approach runs migrations automatically when the container starts.

#### Setup Steps:

1. **Update Coolify configuration:**
   - Go to your Coolify dashboard
   - Navigate to your app settings
   - Change the Dockerfile to use: `Dockerfile.production`
   - Add environment variables:
     ```bash
     ENABLE_DB_BACKUP=true  # Optional: backup before migrations
     RUN_SEED=false         # Set to true if you want to seed after migration
     ```

2. **Deploy:**
   - Push your changes to your repository
   - Coolify will automatically rebuild using the new Dockerfile
   - Migrations will run automatically on container startup

#### How it works:
- Container starts → `migrate-and-start.sh` script runs
- Checks database connection
- Backs up database (if enabled)  
- Runs pending migrations with `prisma migrate deploy`
- Generates fresh Prisma client
- Starts the Next.js application

### Option 2: GitHub Actions CI/CD

Fully automated deployment pipeline with testing and migration.

#### Setup Steps:

1. **Add GitHub Secrets:**
   ```
   COOLIFY_WEBHOOK_URL=your_coolify_webhook_url
   DATABASE_URL=your_production_database_url  
   PRODUCTION_URL=https://your-app-domain.com
   ```

2. **Enable the workflow:**
   - The workflow file is already created at `.github/workflows/deploy.yml`
   - It will run automatically on pushes to `main` branch

#### Features:
- ✅ Runs tests and linting before deployment
- ✅ Builds and pushes Docker image to GitHub Container Registry
- ✅ Triggers Coolify deployment
- ✅ Runs database migrations after successful deployment
- ✅ Verifies deployment with health check

### Option 3: Coolify Pre-deployment Hooks

Simplest approach using Coolify's built-in hooks.

#### Setup Steps:

1. **Configure Coolify hook:**
   - Go to your Coolify app settings
   - Navigate to "Scripts" or "Hooks" section
   - Set Pre-deployment script to: `scripts/coolify-predeploy.sh`

2. **Environment variables:**
   Make sure `DATABASE_URL` is available in your Coolify environment

## 🧪 Testing the Setup

Test your migration setup:

```bash
# Local testing
npm run predeploy

# Check migration status
npm run db:migrate:status

# Health check endpoint
curl https://your-app-domain.com/api/health
```

## 🔒 Safety Features

All approaches include:

- **Database connection testing** before migrations
- **Migration status checking** to avoid unnecessary runs
- **Error handling** with proper exit codes
- **Health check endpoint** for deployment verification
- **Optional database backup** (Docker approach)

## 🚀 Current Migration

The current pending migration will:
- Remove `authorRole` column (data will be lost)
- Add new fields: `submissionType`, `isApproved`, `approvedAt`, `approvedBy`, `email`
- Create `SubmissionType` enum
- Add database indexes for performance

## 📊 Monitoring

- **Health endpoint:** `GET /api/health`
- **Migration logs:** Check your Coolify deployment logs
- **Database status:** `npm run db:migrate:status`

## 🔧 Manual Override

If you need to run migrations manually:

```bash
# SSH into your production server
npm run db:migrate:deploy

# Or using Coolify terminal
docker exec -it your-container-name npx prisma migrate deploy
```

## 🛡️ Rollback Strategy

If something goes wrong:

1. **Revert to previous container image** in Coolify
2. **Restore database backup** (if created)
3. **Check logs** in Coolify deployment section

## ⚙️ Configuration Options

Environment variables for fine-tuning:

```bash
# Docker approach
ENABLE_DB_BACKUP=true|false    # Create backup before migration
RUN_SEED=true|false           # Run database seeding after migration

# All approaches  
DATABASE_URL=postgresql://...  # Required: Database connection
NODE_ENV=production           # Recommended for production
```

## 🎉 Next Steps

1. Choose your preferred approach (Docker recommended)
2. Configure environment variables in Coolify
3. Deploy and monitor the first automated migration
4. Set up monitoring/alerting for deployment failures

Your migrations will now run automatically on every deployment! 🚀