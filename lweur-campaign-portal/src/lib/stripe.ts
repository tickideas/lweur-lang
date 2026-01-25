import 'server-only';
import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // apiVersion: Defaults to the latest supported version, ensuring type compatibility
    });
  }
  return stripeInstance;
};

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
  },
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
  return await getStripe().customers.create({
    email: partnerData.email,
    name: partnerData.name,
    phone: partnerData.phone,
    metadata: {
      source: 'lweur_campaign_portal',
    },
  });
};

export const createSubscription = async (customerId: string, priceId: string) => {
  return await getStripe().subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });
};

export const createPaymentIntent = async (amount: number, currency: string = 'gbp') => {
  return await getStripe().paymentIntents.create({
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
};

// Cancel a Stripe subscription
export const cancelSubscription = async (subscriptionId: string) => {
  try {
    return await getStripe().subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error(`Failed to cancel subscription ${subscriptionId}:`, error);
    throw error;
  }
};

// Delete a Stripe customer
export const deleteCustomer = async (customerId: string) => {
  try {
    return await getStripe().customers.del(customerId);
  } catch (error) {
    console.error(`Failed to delete customer ${customerId}:`, error);
    throw error;
  }
};

// Bulk cancel subscriptions with error handling
export const cancelSubscriptions = async (subscriptionIds: string[]) => {
  const results = await Promise.allSettled(
    subscriptionIds.map(id => cancelSubscription(id))
  );

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason);

  return {
    cancelled: results.filter(r => r.status === 'fulfilled').length,
    failed: errors.length,
    errors
  };
};
