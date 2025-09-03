import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'CAMPAIGN_MANAGER', 'FINANCE', 'VIEWER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const country = (searchParams.get('country') || '').trim();
    const page = Number(searchParams.get('page') || '1');
    const limit = Math.min(Number(searchParams.get('limit') || '25'), 100);
    const skip = (page - 1) * limit;
    const format = (searchParams.get('format') || 'json').toLowerCase();
    const all = (searchParams.get('all') || '').toLowerCase() === 'true';

    const where: any = {};
    if (country) where.country = country;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        skip: all ? 0 : skip,
        take: all ? undefined : limit,
        orderBy: { createdAt: 'desc' },
        include: {
          campaigns: {
            include: { language: { select: { name: true } } },
          },
          payments: true,
        },
      }),
      prisma.partner.count({ where }),
    ]);

    const data = partners.map((p) => {
      const firstPayment = p.payments
        .filter((pay) => pay.status === 'SUCCEEDED')
        .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())[0];
      const firstCampaign = p.campaigns
        .map((c) => c as any)
        .sort((a, b) => new Date(a.startDate || a.createdAt).getTime() - new Date(b.startDate || b.createdAt).getTime())[0];
      const firstContributionAt = firstPayment?.paymentDate || (firstCampaign as any)?.startDate || null;

      const lastPayment = p.payments
        .filter((pay) => pay.status === 'SUCCEEDED')
        .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0];
      const lastCampaign = p.campaigns
        .map((c) => c as any)
        .sort((a, b) => new Date(b.startDate || b.createdAt).getTime() - new Date(a.startDate || a.createdAt).getTime())[0];
      const lastContributionAt = lastPayment?.paymentDate || (lastCampaign as any)?.startDate || null;

      return ({
        id: p.id,
        email: p.email,
        firstName: p.firstName,
        lastName: p.lastName,
        phoneNumber: p.phoneNumber || undefined,
        organization: p.organization || undefined,
        country: p.country,
        createdAt: p.createdAt.toISOString(),
        campaigns: p.campaigns.map((c) => ({
          id: c.id,
          type: c.type,
          status: c.status,
          monthlyAmount: c.monthlyAmount,
          language: { name: c.language.name },
        })),
        totalContributions: p.payments.reduce((sum, pay) => pay.status === 'SUCCEEDED' ? sum + pay.amount : sum, 0),
        firstContributionAt: firstContributionAt ? new Date(firstContributionAt).toISOString() : null,
        lastContributionAt: lastContributionAt ? new Date(lastContributionAt).toISOString() : null,
      });
    });

    if (format === 'csv') {
      const headers = [
        'First Name',
        'Last Name',
        'Email',
        'Organization',
        'Country',
        'Total Contributions (GBP)',
        'First Contribution Date',
        'Active Campaigns',
        'Languages',
      ];
      const rows = data.map((p) => {
        const activeCampaigns = p.campaigns.filter((c) => c.status === 'ACTIVE').length;
        const languages = p.campaigns.map((c) => c.language.name).join('; ');
        const firstDate = p.firstContributionAt ? new Date(p.firstContributionAt).toISOString().slice(0, 10) : '';
        const totalGBP = (p.totalContributions / 100).toFixed(2);
        return [
          p.firstName,
          p.lastName,
          p.email,
          p.organization || '',
          p.country,
          totalGBP,
          firstDate,
          String(activeCampaigns),
          languages,
        ];
      });
      const csv = [headers, ...rows]
        .map((r) => r.map((v) => (typeof v === 'string' && (v.includes(',') || v.includes('"') || v.includes('\n')) ? `"${v.replace(/"/g, '""')}"` : v)).join(','))
        .join('\n');
      const filename = `partners-export-${new Date().toISOString().slice(0,10)}.csv`;
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ data, pagination: { page, limit, total } });
  } catch (err) {
    console.error('Partners API error', err);
    return NextResponse.json({ error: 'Failed to load partners' }, { status: 500 });
  }
}
