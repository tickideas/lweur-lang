import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  region: z.string().optional(),
  status: z.enum(['AVAILABLE', 'ADOPTED', 'PENDING', 'WAITLIST']).optional(),
  search: z.string().optional(),
  priority: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const { region, status, search, priority, page, limit } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (region) {
      where.region = region;
    }

    if (status) {
      where.adoptionStatus = status;
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          nativeName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          countries: {
            hasSome: [search.toUpperCase()],
          },
        },
      ];
    }

    if (priority) {
      where.priority = {
        lte: priority,
      };
    }

    // Get languages with campaign counts
    const [languages, total] = await Promise.all([
      prisma.language.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'asc' },
          { name: 'asc' },
        ],
        include: {
          campaigns: {
            where: {
              status: 'ACTIVE',
            },
            select: {
              id: true,
              type: true,
              partner: {
                select: {
                  firstName: true,
                  lastName: true,
                  organization: true,
                },
              },
            },
          },
        },
      }),
      prisma.language.count({ where }),
    ]);

    // Transform data to include campaign statistics
    const transformedLanguages = languages.map(language => ({
      id: language.id,
      name: language.name,
      nativeName: language.nativeName,
      iso639Code: language.iso639Code,
      region: language.region,
      countries: language.countries,
      speakerCount: language.speakerCount,
      flagUrl: language.flagUrl,
      adoptionStatus: language.adoptionStatus,
      translationNeedsSponsorship: language.translationNeedsSponsorship,
      priority: language.priority,
      description: language.description,
      campaignStats: {
        adoptionCampaigns: language.campaigns.filter(c => c.type === 'ADOPT_LANGUAGE').length,
        translationCampaigns: language.campaigns.filter(c => c.type === 'SPONSOR_TRANSLATION').length,
        totalCampaigns: language.campaigns.length,
      },
      currentSponsor: language.campaigns.find(c => c.type === 'ADOPT_LANGUAGE')?.partner || null,
    }));

    return NextResponse.json({
      data: transformedLanguages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching languages:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get unique regions
export async function OPTIONS() {
  try {
    const regions = await prisma.language.findMany({
      where: { isActive: true },
      select: { region: true },
      distinct: ['region'],
      orderBy: { region: 'asc' },
    });

    return NextResponse.json({
      regions: regions.map(r => r.region),
    });

  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}