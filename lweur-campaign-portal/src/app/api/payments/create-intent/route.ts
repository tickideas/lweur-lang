// src/app/api/payments/create-intent/route.ts
// API endpoint for creating Stripe payment intents and subscriptions
// Handles both one-time and recurring payments with security validation
// RELEVANT FILES: src/lib/rate-limit.ts, src/lib/anti-bot.ts, src/lib/stripe.ts, prisma/schema.prisma

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email';
import { z } from 'zod';
import { checkPaymentRateLimit, getClientIP } from '@/lib/rate-limit';
import { validateAntiBot, optionalAntiBotSchema } from '@/lib/anti-bot';

// Schema for payment intent creation with anti-bot fields
const createPaymentIntentSchema = z.object({
  campaignType: z.enum(['ADOPT_LANGUAGE', 'SPONSOR_TRANSLATION', 'GENERAL_DONATION']),
  languageId: z.string(),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  isRecurring: z.boolean(),
  partnerInfo: z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string().optional(),
    organization: z.string().optional(),
    country: z.string(),
    preferredLanguage: z.string().default('en'),
  }),
  billingAddress: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string(),
  }),
}).merge(optionalAntiBotSchema);

const emailService = new EmailService();

/**
 * Get amount limits from checkout settings for a specific campaign type
 */
async function getAmountLimits(campaignType: 'ADOPT_LANGUAGE' | 'SPONSOR_TRANSLATION' | 'GENERAL_DONATION') {
  const settings = await prisma.checkoutSettings.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  // Default limits if no settings found
  const defaults = {
    ADOPT_LANGUAGE: { min: 1000, max: 100000 },      // £10 - £1000
    SPONSOR_TRANSLATION: { min: 1000, max: 100000 }, // £10 - £1000
    GENERAL_DONATION: { min: 500, max: 500000 },     // £5 - £5000
  };

  if (!settings) {
    return defaults[campaignType];
  }

  switch (campaignType) {
    case 'ADOPT_LANGUAGE':
      return {
        min: settings.adoptLanguageMinAmount,
        max: settings.adoptLanguageMaxAmount,
      };
    case 'SPONSOR_TRANSLATION':
      return {
        min: settings.sponsorTranslationMinAmount,
        max: settings.sponsorTranslationMaxAmount,
      };
    case 'GENERAL_DONATION':
      return {
        min: settings.generalDonationMinAmount,
        max: settings.generalDonationMaxAmount,
      };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_...')) {
      console.error('Stripe secret key not properly configured');
      return NextResponse.json(
        { error: 'Payment service not configured. Please add your Stripe keys to the .env file.' },
        { status: 500 }
      );
    }

    const body = await req.json();

    // Parse and validate request data
    const validatedData = createPaymentIntentSchema.parse(body);
    const {
      campaignType,
      languageId,
      amount,
      currency,
      isRecurring,
      partnerInfo,
      billingAddress,
      honeypot,
      token,
      timestamp,
    } = validatedData;

    // ========================================
    // SECURITY CHECK 1: Anti-Bot Validation
    // ========================================
    if (token && timestamp) {
      const antiBotResult = validateAntiBot({ honeypot, token, timestamp });
      if (!antiBotResult.valid) {
        console.warn(`[SECURITY] Anti-bot validation failed from IP ${getClientIP(req)}: ${antiBotResult.error}`);
        return NextResponse.json(
          { error: antiBotResult.error },
          { status: 400 }
        );
      }
    } else if (honeypot && honeypot !== '') {
      // Honeypot field was filled - likely a bot
      console.warn(`[SECURITY] Honeypot triggered from IP ${getClientIP(req)}`);
      return NextResponse.json(
        { error: 'Invalid submission detected' },
        { status: 400 }
      );
    }

    // ========================================
    // SECURITY CHECK 2: Rate Limiting
    // ========================================
    const rateLimitResult = checkPaymentRateLimit(req, partnerInfo.email);
    if (!rateLimitResult.allowed) {
      console.warn(`[SECURITY] Rate limit exceeded for IP ${getClientIP(req)}, email: ${partnerInfo.email}`);
      return NextResponse.json(
        { error: rateLimitResult.reason || 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // ========================================
    // SECURITY CHECK 3: Amount Validation
    // ========================================
    const limits = await getAmountLimits(campaignType);
    if (amount < limits.min || amount > limits.max) {
      console.warn(`[SECURITY] Invalid amount ${amount} for ${campaignType}. Limits: ${limits.min}-${limits.max}. IP: ${getClientIP(req)}`);
      return NextResponse.json(
        {
          error: 'Invalid amount',
          message: `Amount must be between £${(limits.min / 100).toFixed(2)} and £${(limits.max / 100).toFixed(2)}`
        },
        { status: 400 }
      );
    }

    // Log validated payment attempt (for monitoring)
    console.log(`[PAYMENT] Processing ${campaignType} for ${amount / 100} ${currency} from ${partnerInfo.email}`);

    // Check if language is available for adoption (if it's an adoption campaign)
    if (campaignType === 'ADOPT_LANGUAGE') {
      const language = await prisma.language.findUnique({
        where: { id: languageId },
        include: {
          campaigns: {
            where: {
              type: 'ADOPT_LANGUAGE',
              status: 'ACTIVE',
            },
          },
        },
      });

      if (!language) {
        return NextResponse.json(
          { error: 'Language not found' },
          { status: 404 }
        );
      }

      if (language.campaigns.length > 0) {
        return NextResponse.json(
          { error: 'Language already adopted' },
          { status: 400 }
        );
      }
    } else {
      // For general donations and sponsor translations, just verify language exists
      const language = await prisma.language.findUnique({
        where: { id: languageId }
      });

      if (!language) {
        return NextResponse.json(
          { error: 'Language not found' },
          { status: 404 }
        );
      }
    }

    // Create or find customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: partnerInfo.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: partnerInfo.email,
        name: `${partnerInfo.firstName} ${partnerInfo.lastName}`,
        phone: partnerInfo.phoneNumber,
        address: {
          ...(billingAddress.line1 && { line1: billingAddress.line1 }),
          ...(billingAddress.line2 && { line2: billingAddress.line2 }),
          ...(billingAddress.city && { city: billingAddress.city }),
          ...(billingAddress.state && { state: billingAddress.state }),
          ...(billingAddress.postalCode && { postal_code: billingAddress.postalCode }),
          country: billingAddress.country,
        },
        metadata: {
          campaignType,
          languageId,
          organization: partnerInfo.organization || '',
        },
      });
    }

    // Create or find partner in database
    let partner = await prisma.partner.findUnique({
      where: { email: partnerInfo.email },
    });

    if (!partner) {
      partner = await prisma.partner.create({
        data: {
          ...partnerInfo,
          stripeCustomerId: customer.id,
        },
      });
    } else if (!partner.stripeCustomerId) {
      partner = await prisma.partner.update({
        where: { id: partner.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    let paymentIntentClientSecret: string;
    let stripeSubscriptionId: string | null = null;
    let nextBillingDate: Date;

    if (isRecurring) {
      // Handle recurring payments (subscriptions)
      const productName = campaignType === 'ADOPT_LANGUAGE'
        ? 'Language Adoption'
        : campaignType === 'SPONSOR_TRANSLATION'
          ? 'Translation Sponsorship'
          : 'General Donation';

      const product = await stripe.products.create({
        name: productName,
        description: campaignType === 'ADOPT_LANGUAGE'
          ? 'Monthly language channel adoption for Loveworld Europe'
          : campaignType === 'SPONSOR_TRANSLATION'
            ? 'Monthly translation sponsorship for Passacris program'
            : 'Monthly general donation to support Loveworld Europe\'s ministry',
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: amount,
        currency: currency.toLowerCase(),
        recurring: {
          interval: 'month',
        },
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          campaignType,
          languageId,
          partnerId: partner.id,
        },
      });

      stripeSubscriptionId = subscription.id;
      nextBillingDate = new Date((subscription as any).current_period_end * 1000);

      const invoice = subscription.latest_invoice as any;
      paymentIntentClientSecret = invoice.payment_intent.client_secret;
    } else {
      // Handle one-time payments
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        customer: customer.id,
        setup_future_usage: 'on_session',
        metadata: {
          campaignType,
          languageId,
          partnerId: partner.id,
          isOneTime: 'true',
        },
      });

      paymentIntentClientSecret = paymentIntent.client_secret!;
      // For one-time language adoption, set expiry to 30 days from now
      if (campaignType === 'ADOPT_LANGUAGE') {
        nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      } else {
        nextBillingDate = new Date(); // For one-time donations, no expiry needed
      }
    }

    // Create campaign in database
    const campaign = await prisma.campaign.create({
      data: {
        type: campaignType,
        partnerId: partner.id,
        languageId,
        monthlyAmount: amount,
        currency: currency.toUpperCase(),
        stripeSubscriptionId,
        status: 'ACTIVE',
        nextBillingDate,
      },
      include: {
        partner: true,
        language: true,
      },
    });

    // Update language adoption status if it's a language adoption
    if (campaignType === 'ADOPT_LANGUAGE') {
      await prisma.language.update({
        where: { id: languageId },
        data: { adoptionStatus: 'ADOPTED' },
      });
    }

    // Send welcome email to new partner (optional - don't fail if email service is not configured)
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        await emailService.sendWelcomeEmail({
          ...partner,
          phoneNumber: partner.phoneNumber || undefined,
          organization: partner.organization || undefined,
          stripeCustomerId: partner.stripeCustomerId || undefined
        });

        // Log email communication
        await prisma.communication.create({
          data: {
            partnerId: partner.id,
            type: 'EMAIL',
            subject: `Welcome to Loveworld Europe - ${
              campaignType === 'ADOPT_LANGUAGE'
                ? 'Language Adoption'
                : campaignType === 'SPONSOR_TRANSLATION'
                  ? 'Translation Sponsorship'
                  : 'General Donation'
            } Partnership`,
            content: 'Welcome email sent to new partner',
            sentAt: new Date(),
            status: 'SENT',
          },
        });
      } else {
        console.log('Email service not configured - skipping welcome email');
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the entire process if email fails
    }

    // Create response with rate limit headers
    const response = NextResponse.json({
      subscriptionId: stripeSubscriptionId,
      campaignId: campaign.id,
      clientSecret: paymentIntentClientSecret,
      customerId: customer.id,
      isRecurring: isRecurring,
    });

    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

    return response;

  } catch (error) {
    console.error('Error creating payment intent:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
