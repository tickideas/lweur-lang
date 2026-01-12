// src/app/api/admin/partners/[id]/reset-finances/route.ts
// API endpoint to reset all financial givings for a partner
// WHY: Allows SUPER_ADMIN to delete payment history while preserving partner account
// RELEVANT FILES: src/lib/stripe.ts, src/lib/auth.ts, prisma/schema.prisma

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cancelSubscriptions } from '@/lib/stripe';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Verify SUPER_ADMIN authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - SUPER_ADMIN required' }, { status: 401 });
    }

    const { id } = await params;

    // 2. Fetch partner with campaigns
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        campaigns: {
          select: { id: true, stripeSubscriptionId: true }
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
        stripeWarnings.push(
          `Failed to cancel ${stripeResult.failed} Stripe subscription(s). They may need manual cleanup.`
        );
      }
    }

    // 4. Database transaction: Delete payments and update campaigns
    const result = await prisma.$transaction(async (tx) => {
      // Delete all payments
      const deletedPayments = await tx.payment.deleteMany({
        where: { partnerId: id }
      });

      // Update campaigns to CANCELLED
      await tx.campaign.updateMany({
        where: { partnerId: id },
        data: {
          status: 'CANCELLED',
          stripeSubscriptionId: null,
          endDate: new Date()
        }
      });

      return { deletedPayments: deletedPayments.count };
    });

    return NextResponse.json({
      success: true,
      message: `Reset ${result.deletedPayments} payment(s) for ${partner.firstName} ${partner.lastName}`,
      deletedPayments: result.deletedPayments,
      cancelledSubscriptions: subscriptionIds.length,
      warnings: stripeWarnings.length > 0 ? stripeWarnings : undefined
    });

  } catch (err) {
    console.error('Reset finances API error:', err);
    return NextResponse.json({
      error: 'Failed to reset financial givings',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
