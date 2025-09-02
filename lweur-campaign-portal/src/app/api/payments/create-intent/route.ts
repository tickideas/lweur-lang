import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email';
import { z } from 'zod';

const createPaymentIntentSchema = z.object({
  campaignType: z.enum(['ADOPT_LANGUAGE', 'SPONSOR_TRANSLATION']),
  languageId: z.string(),
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
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string(),
    country: z.string(),
  }),
});

const emailService = new EmailService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createPaymentIntentSchema.parse(body);

    const { campaignType, languageId, partnerInfo, billingAddress } = validatedData;

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
          line1: billingAddress.line1,
          line2: billingAddress.line2,
          city: billingAddress.city,
          state: billingAddress.state,
          postal_code: billingAddress.postalCode,
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

    // Create product and price if they don't exist
    const productName = campaignType === 'ADOPT_LANGUAGE' 
      ? 'Language Adoption' 
      : 'Translation Sponsorship';
    
    let price;
    try {
      // Try to find existing price
      const prices = await stripe.prices.list({
        product: STRIPE_CONFIG.PRODUCT_IDS[campaignType],
        active: true,
        limit: 1,
      });
      
      if (prices.data.length > 0) {
        price = prices.data[0];
      } else {
        throw new Error('Price not found');
      }
    } catch {
      // Create product and price if they don't exist
      const product = await stripe.products.create({
        name: productName,
        description: campaignType === 'ADOPT_LANGUAGE'
          ? 'Monthly language channel adoption for Loveworld Europe'
          : 'Monthly translation sponsorship for Passacris program',
      });

      price = await stripe.prices.create({
        product: product.id,
        unit_amount: STRIPE_CONFIG.MONTHLY_AMOUNT,
        currency: STRIPE_CONFIG.CURRENCY,
        recurring: {
          interval: 'month',
        },
      });
    }

    // Create subscription
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

    // Create campaign in database
    const campaign = await prisma.campaign.create({
      data: {
        type: campaignType,
        partnerId: partner.id,
        languageId,
        monthlyAmount: STRIPE_CONFIG.MONTHLY_AMOUNT,
        currency: STRIPE_CONFIG.CURRENCY.toUpperCase(),
        stripeSubscriptionId: subscription.id,
        status: 'ACTIVE',
        nextBillingDate: new Date(subscription.current_period_end * 1000),
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

    // Send welcome email to new partner
    try {
      await emailService.sendWelcomeEmail(campaign.partner);

      // Log email communication
      await prisma.communication.create({
        data: {
          partnerId: partner.id,
          type: 'EMAIL',
          subject: `Welcome to Loveworld Europe - ${campaignType === 'ADOPT_LANGUAGE' ? 'Language Adoption' : 'Translation Sponsorship'} Partnership`,
          content: 'Welcome email sent to new partner',
          sentAt: new Date(),
          status: 'SENT',
        },
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the entire process if email fails
    }

    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice.payment_intent;

    return NextResponse.json({
      subscriptionId: subscription.id,
      campaignId: campaign.id,
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    
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