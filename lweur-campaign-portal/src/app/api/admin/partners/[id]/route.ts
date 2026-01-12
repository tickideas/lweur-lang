import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        campaigns: {
          include: { language: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 50,
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const totalContributions = partner.payments.reduce(
      (sum, p) => (p.status === 'SUCCEEDED' ? sum + p.amount : sum),
      0
    );

    const firstPayment = partner.payments
      .filter((p) => p.status === 'SUCCEEDED')
      .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())[0];
    const firstCampaign = partner.campaigns
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];
    const firstContributionAt = firstPayment?.paymentDate || firstCampaign?.startDate || null;
    const lastPayment = partner.payments
      .filter((p) => p.status === 'SUCCEEDED')
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0];
    const lastCampaign = partner.campaigns
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0];
    const lastContributionAt = lastPayment?.paymentDate || lastCampaign?.startDate || null;

    return NextResponse.json({
      data: {
        id: partner.id,
        email: partner.email,
        firstName: partner.firstName,
        lastName: partner.lastName,
        phoneNumber: partner.phoneNumber,
        organization: partner.organization,
        country: partner.country,
        createdAt: partner.createdAt,
        firstContributionAt,
        lastContributionAt,
        totalContributions,
        campaigns: partner.campaigns.map((c) => ({
          id: c.id,
          type: c.type,
          status: c.status,
          monthlyAmount: c.monthlyAmount,
          startDate: c.startDate,
          language: { id: c.languageId, name: c.language.name },
        })),
        payments: partner.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          paymentDate: p.paymentDate,
          stripePaymentIntentId: p.stripePaymentIntentId,
        })),
      },
    });
  } catch (err) {
    console.error('Partner details API error', err);
    return NextResponse.json({ error: 'Failed to load partner' }, { status: 500 });
  }
}
