import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const emailService = new EmailService();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  // Find the campaign associated with this subscription
  const campaign = await prisma.campaign.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    include: { 
      partner: true, 
      language: true 
    },
  });

  if (!campaign) {
    console.error('Campaign not found for subscription:', subscriptionId);
    return;
  }

  // Record the payment
  await prisma.payment.create({
    data: {
      campaignId: campaign.id,
      partnerId: campaign.partnerId,
      amount: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      stripePaymentIntentId: invoice.payment_intent as string,
      stripeInvoiceId: invoice.id,
      status: 'SUCCEEDED',
      paymentDate: new Date(invoice.created * 1000),
    },
  });

  // Update campaign next billing date
  if (invoice.period_end) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        nextBillingDate: new Date(invoice.period_end * 1000),
        status: 'ACTIVE',
      },
    });
  }

  // Send payment confirmation email
  try {
    await emailService.sendPaymentConfirmation(
      campaign.partner,
      invoice.amount_paid / 100, // Convert from cents
      invoice.currency.toUpperCase()
    );

    // Log email communication
    await prisma.communication.create({
      data: {
        partnerId: campaign.partnerId,
        type: 'EMAIL',
        subject: 'Thank you for your partnership - Payment Confirmation',
        content: `Payment confirmation email sent for ${invoice.currency.toUpperCase()} ${(invoice.amount_paid / 100).toFixed(2)}`,
        sentAt: new Date(),
        status: 'SENT',
      },
    });
  } catch (emailError) {
    console.error('Failed to send payment confirmation email:', emailError);
  }

  console.log(`Payment succeeded for campaign ${campaign.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  const campaign = await prisma.campaign.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    include: { 
      partner: true, 
      language: true 
    },
  });

  if (!campaign) {
    console.error('Campaign not found for subscription:', subscriptionId);
    return;
  }

  // Record the failed payment
  await prisma.payment.create({
    data: {
      campaignId: campaign.id,
      partnerId: campaign.partnerId,
      amount: invoice.amount_due,
      currency: invoice.currency.toUpperCase(),
      stripeInvoiceId: invoice.id,
      status: 'FAILED',
      paymentDate: new Date(invoice.created * 1000),
      failureReason: 'Payment failed',
    },
  });

  // Send payment failed notification email
  try {
    await emailService.sendPaymentFailed(
      campaign.partner,
      invoice.amount_due / 100, // Convert from cents
      invoice.currency.toUpperCase()
    );

    // Log email communication
    await prisma.communication.create({
      data: {
        partnerId: campaign.partnerId,
        type: 'EMAIL',
        subject: 'Payment Update Required - Loveworld Europe',
        content: `Payment failed notification sent for ${invoice.currency.toUpperCase()} ${(invoice.amount_due / 100).toFixed(2)}`,
        sentAt: new Date(),
        status: 'SENT',
      },
    });
  } catch (emailError) {
    console.error('Failed to send payment failed email:', emailError);
  }

  console.log(`Payment failed for campaign ${campaign.id}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // Subscription creation is handled in the campaign creation API
  console.log(`Subscription created: ${subscription.id}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const campaign = await prisma.campaign.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!campaign) {
    console.error('Campaign not found for subscription:', subscription.id);
    return;
  }

  // Update campaign status based on subscription status
  let campaignStatus: 'ACTIVE' | 'PAUSED' | 'CANCELLED' = 'ACTIVE';
  
  switch (subscription.status) {
    case 'active':
      campaignStatus = 'ACTIVE';
      break;
    case 'paused':
      campaignStatus = 'PAUSED';
      break;
    case 'canceled':
    case 'incomplete_expired':
    case 'unpaid':
      campaignStatus = 'CANCELLED';
      break;
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: campaignStatus,
      nextBillingDate: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000) 
        : null,
    },
  });

  console.log(`Subscription updated: ${subscription.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const campaign = await prisma.campaign.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!campaign) {
    console.error('Campaign not found for subscription:', subscription.id);
    return;
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: 'CANCELLED',
      endDate: new Date(),
    },
  });

  console.log(`Subscription deleted: ${subscription.id}`);
}