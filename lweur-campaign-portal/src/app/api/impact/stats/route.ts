// src/app/api/impact/stats/route.ts
// API endpoint to fetch real-time impact statistics from the database
// Returns total languages, total speakers, total countries, and other key metrics
// RELEVANT FILES: src/app/impact/page.tsx, src/components/impact/impact-hero.tsx, src/lib/prisma.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [languageStats, countryRows, adoptedLanguages, availableLanguages] = await Promise.all([
      prisma.language.aggregate({
        where: { isActive: true },
        _count: { _all: true },
        _sum: { speakerCount: true },
      }),
      prisma.language.findMany({
        where: { isActive: true },
        select: { countries: true },
      }),
      prisma.language.count({ where: { isActive: true, adoptionStatus: 'ADOPTED' } }),
      prisma.language.count({ where: { isActive: true, adoptionStatus: 'AVAILABLE' } }),
    ]);

    const totalSpeakers = Number(languageStats._sum.speakerCount ?? 0);
    const totalCountries = new Set(countryRows.flatMap((lang) => lang.countries)).size;

    return NextResponse.json({
      totalLanguages: languageStats._count._all,
      totalSpeakers,
      totalCountries,
      adoptedLanguages,
      availableLanguages,
      formattedSpeakers: new Intl.NumberFormat('en-GB', {
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(totalSpeakers),
    });
  } catch (error) {
    console.error('Error fetching impact stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch impact statistics' },
      { status: 500 }
    );
  }
}

export const revalidate = 300;
