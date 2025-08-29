import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  MONTHLY_AMOUNT: 15000, // £150 in pence
  CURRENCY: 'gbp',
  PAYMENT_METHOD_TYPES: ['card'],
  PRODUCT_IDS: {
    ADOPT_LANGUAGE: 'prod_adopt_language',
    SPONSOR_TRANSLATION: 'prod_sponsor_translation',
  },
} as const;

// Helper functions for Stripe operations
export const createCustomer = async (partnerData: {
  email: string;
  name: string;
  phone?: string;
}) => {
  return await stripe.customers.create({
    email: partnerData.email,
    name: partnerData.name,
    phone: partnerData.phone,
    metadata: {
      source: 'lweur_campaign_portal',
    },
  });
};

export const createSubscription = async (customerId: string, priceId: string) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });
};

export const createPaymentIntent = async (amount: number, currency: string = 'gbp') => {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
  });
};

export const formatAmountForDisplay = (amount: number, currency: string = 'gbp'): string => {
  const numberFormat = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
    currencyDisplay: 'symbol',
  });
  return numberFormat.format(amount / 100);
};

export const formatAmountFromDisplay = (amount: string): number => {
  // Remove currency symbols and convert to pence
  const cleanAmount = amount.replace(/[£$€,\\s]/g, '');
  return Math.round(parseFloat(cleanAmount) * 100);
};"