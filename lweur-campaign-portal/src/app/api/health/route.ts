// src/app/api/health/route.ts
// Health check endpoint for deployment verification and monitoring
// Verifies database connectivity and application readiness
// RELEVANT FILES: scripts/migrate-and-start.sh, .github/workflows/deploy.yml

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if essential tables exist (basic smoke test)
    const impactStoryCount = await prisma.impactStory.count();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      migrations: 'applied',
      impactStories: impactStoryCount
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    }, { status: 503 });
  }
}