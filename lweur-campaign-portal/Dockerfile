# /Users/0xanyi/Developer/lweur-lang/lweur-campaign-portal/Dockerfile
# Multi-stage Docker build for Next.js 15 Loveworld Europe Campaign Portal
# Optimized for production deployment on Coolify with proper caching and security
# RELEVANT FILES: package.json, next.config.mjs, prisma/schema.prisma, src/app/layout.tsx

# Use official Node.js 18 LTS image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files (including lockfile if present)
COPY package.json package-lock.json* ./
# Install all dependencies (including dev) so that Next.js can run lint/type checks during build.
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/migrate-and-start.sh ./migrate-and-start.sh

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Optionally prune dev dependencies to reduce image size (keep only prod deps referenced in standalone output)
RUN npm prune --production

# Make migration script executable
RUN chmod +x ./migrate-and-start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]