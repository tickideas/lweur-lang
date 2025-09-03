import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'CAMPAIGN_MANAGER', 'FINANCE', 'VIEWER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // targets for progress; adjust as needed
    const MONTHLY_REVENUE_TARGET_GBP = 100_000; // £100k target for progress bar only

    const [
      paymentsAgg,
      activeCampaigns,
      adoptedLanguages,
      totalLanguages,
      sponsorCampaigns,
      monthlyRevenueAgg,
      recentCampaigns,
    ] = await Promise.all([
      prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true } }),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      prisma.language.count({ where: { adoptionStatus: 'ADOPTED' } }),
      prisma.language.count(),
      prisma.campaign.count({ where: { type: 'SPONSOR_TRANSLATION', status: 'ACTIVE' } }),
      prisma.campaign.aggregate({ where: { status: 'ACTIVE' }, _sum: { monthlyAmount: true } }),
      prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { partner: true, language: true },
      }),
    ]);

    const totalRevenue = (paymentsAgg._sum.amount || 0) / 100;
    const monthlyRevenue = (monthlyRevenueAgg._sum.monthlyAmount || 0) / 100;

    const recentActivities = recentCampaigns.map((c) => ({
      id: c.id,
      partnerName: `${c.partner.firstName} ${c.partner.lastName}`,
      type: c.type,
      language: c.language.name,
      monthlyAmount: c.monthlyAmount / 100,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      data: {
        overview: {
          totalRevenue,
          activeSubscriptions: activeCampaigns,
          languageAdoptions: adoptedLanguages,
          totalLanguages,
          translationSponsors: sponsorCampaigns,
          monthlyRevenue,
          monthlyRevenueTarget: MONTHLY_REVENUE_TARGET_GBP,
        },
        recentActivities,
        progress: {
          languages: {
            current: adoptedLanguages,
            total: totalLanguages,
            percent: totalLanguages ? Math.round((adoptedLanguages / totalLanguages) * 100) : 0,
          },
          sponsors: {
            current: sponsorCampaigns,
            total: totalLanguages || 1,
            percent: totalLanguages ? Math.round((sponsorCampaigns / totalLanguages) * 100) : 0,
          },
          revenue: {
            current: monthlyRevenue,
            target: MONTHLY_REVENUE_TARGET_GBP,
            percent: MONTHLY_REVENUE_TARGET_GBP ? Math.round((monthlyRevenue / MONTHLY_REVENUE_TARGET_GBP) * 100) : 0,
          },
        },
      },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Dashboard API error', err);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}

