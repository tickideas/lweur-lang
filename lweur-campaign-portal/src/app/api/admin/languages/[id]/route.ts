import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'CAMPAIGN_MANAGER', 'FINANCE', 'VIEWER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const lang = await prisma.language.findUnique({ where: { id } });
    if (!lang) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [adoptionCount, sponsorshipCount] = await Promise.all([
      prisma.campaign.count({ where: { languageId: id, type: 'ADOPT_LANGUAGE', status: 'ACTIVE' } }),
      prisma.campaign.count({ where: { languageId: id, type: 'SPONSOR_TRANSLATION', status: 'ACTIVE' } }),
    ]);

    return NextResponse.json({
      data: {
        id: lang.id,
        name: lang.name,
        nativeName: lang.nativeName,
        iso639Code: lang.iso639Code,
        region: lang.region,
        countries: lang.countries,
        speakerCount: Number(lang.speakerCount),
        flagUrl: lang.flagUrl,
        isActive: lang.isActive,
        adoptionStatus: lang.adoptionStatus,
        translationNeedsSponsorship: lang.translationNeedsSponsorship,
        priority: lang.priority,
        description: lang.description || undefined,
        createdAt: lang.createdAt.toISOString(),
        updatedAt: lang.updatedAt.toISOString(),
        metrics: { adoptionCount, sponsorshipCount },
      },
    });
  } catch (err) {
    console.error('Language GET error', err);
    return NextResponse.json({ error: 'Failed to load language' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'CAMPAIGN_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const body = await req.json();

    // Build update payload selectively
    const data: any = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.nativeName !== undefined) data.nativeName = String(body.nativeName).trim();
    if (body.iso639Code !== undefined) data.iso639Code = String(body.iso639Code).trim();
    if (body.region !== undefined) data.region = String(body.region).trim();
    if (body.countries !== undefined) {
      data.countries = Array.isArray(body.countries)
        ? body.countries.map((c: unknown) => String(c))
        : String(body.countries).split(',').map((c) => c.trim()).filter(Boolean);
    }
    if (body.speakerCount !== undefined) data.speakerCount = Number(body.speakerCount) || 0;
    if (body.flagUrl !== undefined) data.flagUrl = String(body.flagUrl).trim();
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.adoptionStatus !== undefined) data.adoptionStatus = String(body.adoptionStatus);
    if (body.translationNeedsSponsorship !== undefined) data.translationNeedsSponsorship = Boolean(body.translationNeedsSponsorship);
    if (body.priority !== undefined) data.priority = Number(body.priority) || 0;
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;

    const updated = await prisma.language.update({ where: { id }, data });
    return NextResponse.json({ data: { id: updated.id } });
  } catch (err: any) {
    console.error('Language PUT error', err);
    const msg = err?.code === 'P2002' ? 'Duplicate field value (unique constraint)' : 'Failed to update language';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;

    // Safety: prevent delete if campaigns exist
    const campaignCount = await prisma.campaign.count({ where: { languageId: id } });
    if (campaignCount > 0) {
      return NextResponse.json({ error: 'Cannot delete language with existing campaigns' }, { status: 400 });
    }

    await prisma.language.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Language DELETE error', err);
    return NextResponse.json({ error: 'Failed to delete language' }, { status: 500 });
  }
}

