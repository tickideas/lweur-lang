// src/app/api/impact/stats/route.ts
// API endpoint to fetch real-time impact statistics from the database
// Returns total languages, total speakers, total countries, and other key metrics
// RELEVANT FILES: src/app/impact/page.tsx, src/components/impact/impact-hero.tsx, src/lib/prisma.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all languages with their speaker counts and countries
    const languages = await prisma.language.findMany({
      select: {
        speakerCount: true,
        countries: true,
        adoptionStatus: true,
      },
    });

    // Calculate statistics
    const totalLanguages = languages.length;
    const totalSpeakers = languages.reduce((sum, lang) => sum + Number(lang.speakerCount), 0);
    
    // Get unique countries from all languages
    const allCountries = new Set<string>();
    languages.forEach(lang => {
      lang.countries.forEach(country => allCountries.add(country));
    });
    const totalCountries = allCountries.size;

    // Additional statistics
    const adoptedLanguages = languages.filter(lang => lang.adoptionStatus === 'ADOPTED').length;
    const availableLanguages = languages.filter(lang => lang.adoptionStatus === 'AVAILABLE').length;

    const stats = {
      totalLanguages,
      totalSpeakers,
      totalCountries,
      adoptedLanguages,
      availableLanguages,
      // Format for display
      formattedSpeakers: new Intl.NumberFormat('en-GB', {
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(totalSpeakers),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching impact stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch impact statistics' },
      { status: 500 }
    );
  }
}