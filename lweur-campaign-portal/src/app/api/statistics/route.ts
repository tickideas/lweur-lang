// src/app/api/statistics/route.ts
// API endpoint to fetch statistics data for display on frontend
// Calculates languages supported, people reached, and broadcasting status from database
// RELEVANT FILES: prisma/schema.prisma, donate/page.tsx, languages/route.ts, lib/prisma.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all active languages and their speaker counts
    const languages = await prisma.language.findMany({
      where: {
        isActive: true
      },
      select: {
        speakerCount: true,
        adoptionStatus: true
      }
    });

    // Calculate total languages supported
    const totalLanguages = languages.length;

    // Calculate total people reached (sum of all speaker counts)
    const totalPeopleReached = languages.reduce(
      (total, language) => total + language.speakerCount, 
      0
    );

    // Get active campaigns count
    const activeCampaignsCount = await prisma.campaign.count({
      where: {
        status: 'ACTIVE'
      }
    });

    // Get adopted languages count
    const adoptedLanguagesCount = languages.filter(
      lang => lang.adoptionStatus === 'ADOPTED'
    ).length;

    // Broadcasting is always 24/7 (constant)
    const broadcasting = '24/7';

    return NextResponse.json({
      success: true,
      data: {
        languagesSupported: totalLanguages,
        peopleReached: totalPeopleReached,
        broadcasting: broadcasting,
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