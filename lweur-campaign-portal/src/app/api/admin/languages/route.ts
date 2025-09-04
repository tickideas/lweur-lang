import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/languages
// Query params: search, status, region, page, limit, activeOnly
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'CAMPAIGN_MANAGER', 'FINANCE', 'VIEWER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const region = (searchParams.get('region') || '').trim();
    const status = (searchParams.get('status') || '').trim();
    const activeOnly = (searchParams.get('activeOnly') || '').toLowerCase() === 'true';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '25')));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (activeOnly) where.isActive = true;
    if (region) where.region = { contains: region, mode: 'insensitive' };
    if (status) where.adoptionStatus = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nativeName: { contains: search, mode: 'insensitive' } },
        { iso639Code: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [languages, total, adoptionCounts, sponsorshipCounts] = await Promise.all([
      prisma.language.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { name: 'asc' }],
      }),
      prisma.language.count({ where }),
      prisma.campaign.groupBy({
        by: ['languageId'],
        where: { type: 'ADOPT_LANGUAGE', status: 'ACTIVE' },
        _count: { _all: true },
      }),
      prisma.campaign.groupBy({
        by: ['languageId'],
        where: { type: 'SPONSOR_TRANSLATION', status: 'ACTIVE' },
        _count: { _all: true },
      }),
    ]);

    const adoptionMap = new Map(adoptionCounts.map((c) => [c.languageId, c._count._all]));
    const sponsorshipMap = new Map(sponsorshipCounts.map((c) => [c.languageId, c._count._all]));

    const data = languages.map((l) => ({
      id: l.id,
      name: l.name,
      nativeName: l.nativeName,
      iso639Code: l.iso639Code,
      region: l.region,
      countries: l.countries,
      speakerCount: Number(l.speakerCount),
      flagUrl: l.flagUrl,
      isActive: l.isActive,
      adoptionStatus: l.adoptionStatus,
      translationNeedsSponsorship: l.translationNeedsSponsorship,
      priority: l.priority,
      description: l.description || undefined,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      metrics: {
        adoptionCount: adoptionMap.get(l.id) || 0,
        sponsorshipCount: sponsorshipMap.get(l.id) || 0,
      },
    }));

    return NextResponse.json({ data, pagination: { page, limit, total } });
  } catch (err) {
    console.error('Languages GET error', err);
    return NextResponse.json({ error: 'Failed to load languages' }, { status: 500 });
  }
}

// POST /api/admin/languages
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'CAMPAIGN_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Basic validation
    const required: Array<keyof typeof body> = [
      'name', 'nativeName', 'iso639Code', 'region', 'countries', 'speakerCount', 'flagUrl',
    ];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === '') {
        return NextResponse.json({ error: `Missing field: ${String(key)}` }, { status: 400 });
      }
    }

    const created = await prisma.language.create({
      data: {
        name: String(body.name).trim(),
        nativeName: String(body.nativeName).trim(),
        iso639Code: String(body.iso639Code).trim(),
        region: String(body.region).trim(),
        countries: Array.isArray(body.countries)
          ? body.countries.map((c: unknown) => String(c))
          : String(body.countries).split(',').map((c) => c.trim()).filter(Boolean),
        speakerCount: Number(body.speakerCount) || 0,
        flagUrl: String(body.flagUrl).trim(),
        isActive: body.isActive === undefined ? true : Boolean(body.isActive),
        adoptionStatus: body.adoptionStatus && typeof body.adoptionStatus === 'string' ? body.adoptionStatus : 'AVAILABLE',
        translationNeedsSponsorship: body.translationNeedsSponsorship === undefined ? true : Boolean(body.translationNeedsSponsorship),
        priority: body.priority === undefined ? 1 : Number(body.priority),
        description: body.description ? String(body.description) : null,
      },
    });

    return NextResponse.json({ data: { id: created.id } }, { status: 201 });
  } catch (err: any) {
    console.error('Languages POST error', err);
    const msg = err?.code === 'P2002' ? 'Language already exists (unique constraint)' : 'Failed to create language';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

