import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cancelSubscriptions, deleteCustomer } from '@/lib/stripe';

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
          include: {
            campaign: {
              select: { stripeSubscriptionId: true },
            },
          },
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
          stripeInvoiceId: p.stripeInvoiceId,
          isRecurring: !!(p.stripeInvoiceId || p.campaign?.stripeSubscriptionId),
        })),
      },
    });
  } catch (err) {
    console.error('Partner details API error', err);
    return NextResponse.json({ error: 'Failed to load partner' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Verify SUPER_ADMIN authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - SUPER_ADMIN required' }, { status: 401 });
    }

    const { id } = await params;

    // 2. Fetch partner with full details
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        campaigns: {
          select: { id: true, stripeSubscriptionId: true }
        },
        _count: {
          select: {
            campaigns: true,
            payments: true,
            communications: true
          }
        }
      }
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // 3. Cancel Stripe subscriptions
    const subscriptionIds = partner.campaigns
      .map(c => c.stripeSubscriptionId)
      .filter((id): id is string => id !== null);

    let stripeWarnings: string[] = [];
    if (subscriptionIds.length > 0) {
      const stripeResult = await cancelSubscriptions(subscriptionIds);
      if (stripeResult.failed > 0) {
        stripeWarnings.push(`Failed to cancel ${stripeResult.failed} Stripe subscription(s)`);
      }
    }

    // 4. Delete Stripe customer
    if (partner.stripeCustomerId) {
      try {
        await deleteCustomer(partner.stripeCustomerId);
      } catch (err) {
        console.error('Failed to delete Stripe customer:', err);
        stripeWarnings.push('Failed to delete Stripe customer');
      }
    }

    // 5. Delete partner (CASCADE handles campaigns, payments, communications)
    await prisma.partner.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: `Partner ${partner.firstName} ${partner.lastName} deleted successfully`,
      deletedRecords: {
        campaigns: partner._count.campaigns,
        payments: partner._count.payments,
        communications: partner._count.communications
      },
      stripeCleaned: stripeWarnings.length === 0,
      warnings: stripeWarnings.length > 0 ? stripeWarnings : undefined
    });

  } catch (err) {
    console.error('Delete partner API error:', err);
    return NextResponse.json({
      error: 'Failed to delete partner',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
