import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const emailService = new EmailService();

// Type for invoice data with subscription info (Stripe API 2025+)
// Extends Stripe.Invoice to include the 'parent' property safely
interface InvoiceWithSubscription extends Stripe.Invoice {
  parent: Stripe.Invoice.Parent | null;
  payment_intent: Stripe.PaymentIntent | string | null;
}

function getSubscriptionId(invoice: InvoiceWithSubscription): string | null {
  const parentSub = invoice.parent?.subscription_details?.subscription;
  return typeof parentSub === 'string' ? parentSub : parentSub?.id ?? null;
}

function getPaymentIntentId(invoice: InvoiceWithSubscription): string | null {
  if (!invoice.payment_intent) return null;
  return typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent.id;
}

// Type for subscription data (Stripe API 2025+)
interface SubscriptionWithPeriod {
  id: string;
  status: string;
  current_period_end?: number;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check - prevent duplicate processing using database
  try {
    await prisma.processedWebhookEvent.create({
      data: {
        eventId: event.id,
      },
    });
  } catch (e) {
    // If P2002 (unique constraint violation), event was already processed
    if ((e as any).code === 'P2002') {
      console.log(`Duplicate webhook event detected: ${event.id}`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    // For other errors, log and re-throw or handle gracefully
    console.error('Error checking webhook idempotency:', e);
    // We might want to fail safe or fail open?
    // In case of DB errors, failing open (processing) might be safer than failing closed (missing payment), 
    // but failing closed is safer for idempotency. 
    // Let's fail closed for security/consistency but log error.
    return NextResponse.json({ error: 'Idempotency check failed' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as InvoiceWithSubscription);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as InvoiceWithSubscription);
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
  const inv = invoice as unknown as InvoiceWithSubscription;
  const subscriptionId = getSubscriptionId(inv);
  
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
      amount: inv.amount_paid,
      currency: inv.currency.toUpperCase(),
      stripePaymentIntentId: getPaymentIntentId(inv),
      stripeInvoiceId: inv.id,
      status: 'SUCCEEDED',
      paymentDate: new Date(inv.created * 1000),
    },
  });

  // Update campaign next billing date
  if (inv.period_end) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        nextBillingDate: new Date(inv.period_end * 1000),
        status: 'ACTIVE',
      },
    });
  }

  // Send payment confirmation email
  try {
    await emailService.sendPaymentConfirmation(
      campaign.partner,
      inv.amount_paid / 100, // Convert from cents
      inv.currency.toUpperCase()
    );

    // Log email communication
    await prisma.communication.create({
      data: {
        partnerId: campaign.partnerId,
        type: 'EMAIL',
        subject: 'Thank you for your partnership - Payment Confirmation',
        content: `Payment confirmation email sent for ${inv.currency.toUpperCase()} ${(inv.amount_paid / 100).toFixed(2)}`,
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
  const inv = invoice as unknown as InvoiceWithSubscription;
  const subscriptionId = getSubscriptionId(inv);
  
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
      amount: inv.amount_due,
      currency: inv.currency.toUpperCase(),
      stripeInvoiceId: inv.id,
      status: 'FAILED',
      paymentDate: new Date(inv.created * 1000),
      failureReason: 'Payment failed',
    },
  });

  // Send payment failed notification email
  try {
    await emailService.sendPaymentFailed(campaign.partner);

    // Log email communication
    await prisma.communication.create({
      data: {
        partnerId: campaign.partnerId,
        type: 'EMAIL',
        subject: 'Payment Update Required - Loveworld Europe',
        content: `Payment failed notification sent for ${inv.currency.toUpperCase()} ${(inv.amount_due / 100).toFixed(2)}`,
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
  const sub = subscription as unknown as SubscriptionWithPeriod;
  
  const campaign = await prisma.campaign.findFirst({
    where: { stripeSubscriptionId: sub.id },
  });

  if (!campaign) {
    console.error('Campaign not found for subscription:', sub.id);
    return;
  }

  // Update campaign status based on subscription status
  let campaignStatus: 'ACTIVE' | 'PAUSED' | 'CANCELLED' = 'ACTIVE';
  
  switch (sub.status) {
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
      nextBillingDate: sub.current_period_end 
        ? new Date(sub.current_period_end * 1000) 
        : null,
    },
  });

  console.log(`Subscription updated: ${sub.id}`);
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