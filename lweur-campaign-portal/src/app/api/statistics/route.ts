// src/app/api/statistics/route.ts
// API endpoint to fetch statistics data for display on frontend
// Calculates languages supported, people reached, and broadcasting status from database
// RELEVANT FILES: prisma/schema.prisma, donate/page.tsx, languages/route.ts, lib/prisma.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [languageStats, activeCampaignsCount, adoptedLanguagesCount] = await Promise.all([
      prisma.language.aggregate({
        where: { isActive: true },
        _count: { _all: true },
        _sum: { speakerCount: true },
      }),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      prisma.language.count({ where: { isActive: true, adoptionStatus: 'ADOPTED' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        languagesSupported: languageStats._count._all,
        peopleReached: Number(languageStats._sum.speakerCount ?? 0),
        broadcasting: '24/7',
        activeCampaigns: activeCampaignsCount,
        adoptedLanguages: adoptedLanguagesCount
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch statistics',
        data: null
      },
      { status: 500 }
    );
  }
}

export const revalidate = 300;
