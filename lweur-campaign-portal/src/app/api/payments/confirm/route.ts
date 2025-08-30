import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  campaignId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentIntentId, campaignId } = confirmPaymentSchema.parse(body);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Find the campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        partner: true,
        language: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Record the initial payment
    const payment = await prisma.payment.create({
      data: {
        campaignId: campaign.id,
        partnerId: campaign.partnerId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        stripePaymentIntentId: paymentIntent.id,
        status: 'SUCCEEDED',
        paymentDate: new Date(),
      },
    });

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'ACTIVE',
      },
    });

    // Send confirmation email (placeholder for now)
    // TODO: Implement email sending

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        type: campaign.type,
        language: campaign.language.name,
        amount: campaign.monthlyAmount,
        currency: campaign.currency,
      },
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        date: payment.paymentDate,
      },
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}