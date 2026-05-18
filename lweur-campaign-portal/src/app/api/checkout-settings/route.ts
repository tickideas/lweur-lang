// src/app/api/checkout-settings/route.ts
// Public API route for retrieving checkout settings for use in checkout flow
// Provides necessary configuration data for amount selection and checkout process
// RELEVANT FILES: amount-selection.tsx, checkout-wizard.tsx, admin/checkout-settings/route.ts, prisma/schema.prisma

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const defaultSettings = {
  availableCurrencies: ['GBP', 'EUR', 'USD'],
  defaultCurrency: 'GBP',
  adoptLanguageDefaultAmount: 15000,
  adoptLanguagePresetAmounts: [2000, 3500, 5000, 15000],
  adoptLanguageMinAmount: 1000,
  adoptLanguageMaxAmount: 100000,
  sponsorTranslationDefaultAmount: 15000,
  sponsorTranslationPresetAmounts: [2000, 3500, 5000, 15000],
  sponsorTranslationMinAmount: 1000,
  sponsorTranslationMaxAmount: 100000,
  generalDonationDefaultAmount: 5000,
  generalDonationPresetAmounts: [2500, 5000, 10000, 15000, 25000],
  generalDonationMinAmount: 500,
  generalDonationMaxAmount: 500000,
  showOneTimeOption: false,
  requirePhone: false,
  requireOrganization: false,
  hearFromUsOptions: ['Search Engine', 'Social Media', 'Friend/Family', 'Church', 'Advertisement', 'Email', 'Other'],
  checkoutTitle: 'Your generosity is transforming lives!',
  checkoutSubtitle: 'Support Loveworld Europe\'s mission to reach every European language with the Gospel',
};

// GET - Retrieve public checkout settings (no authentication required)
export async function GET(_request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not configured; checkout settings unavailable');
      return NextResponse.json(
        { success: false, error: 'Checkout settings unavailable' },
        { status: 503 }
      );
    }

    // Get the checkout settings
    const settings = await prisma.checkoutSettings.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        availableCurrencies: true,
        defaultCurrency: true,
        adoptLanguageDefaultAmount: true,
        adoptLanguagePresetAmounts: true,
        adoptLanguageMinAmount: true,
        adoptLanguageMaxAmount: true,
        sponsorTranslationDefaultAmount: true,
        sponsorTranslationPresetAmounts: true,
        sponsorTranslationMinAmount: true,
        sponsorTranslationMaxAmount: true,
        generalDonationDefaultAmount: true,
        generalDonationPresetAmounts: true,
        generalDonationMinAmount: true,
        generalDonationMaxAmount: true,
        showOneTimeOption: true,
        requirePhone: true,
        requireOrganization: true,
        hearFromUsOptions: true,
        checkoutTitle: true,
        checkoutSubtitle: true,
      }
    });

    // Return default settings if none exist in database
    if (!settings) {
      return NextResponse.json({
        success: true,
        settings: defaultSettings
      });
    }

    // Return only public-facing settings (no sensitive admin data)
    const publicSettings = {
      availableCurrencies: settings.availableCurrencies,
      defaultCurrency: settings.defaultCurrency,
      adoptLanguageDefaultAmount: settings.adoptLanguageDefaultAmount,
      adoptLanguagePresetAmounts: settings.adoptLanguagePresetAmounts,
      adoptLanguageMinAmount: settings.adoptLanguageMinAmount,
      adoptLanguageMaxAmount: settings.adoptLanguageMaxAmount,
      sponsorTranslationDefaultAmount: settings.sponsorTranslationDefaultAmount,
      sponsorTranslationPresetAmounts: settings.sponsorTranslationPresetAmounts,
      sponsorTranslationMinAmount: settings.sponsorTranslationMinAmount,
      sponsorTranslationMaxAmount: settings.sponsorTranslationMaxAmount,
      generalDonationDefaultAmount: settings.generalDonationDefaultAmount,
      generalDonationPresetAmounts: settings.generalDonationPresetAmounts,
      generalDonationMinAmount: settings.generalDonationMinAmount,
      generalDonationMaxAmount: settings.generalDonationMaxAmount,
      showOneTimeOption: settings.showOneTimeOption,
      requirePhone: settings.requirePhone,
      requireOrganization: settings.requireOrganization,
      hearFromUsOptions: settings.hearFromUsOptions,
      checkoutTitle: settings.checkoutTitle,
      checkoutSubtitle: settings.checkoutSubtitle,
    };

    return NextResponse.json({
      success: true,
      settings: publicSettings
    });

  } catch (error) {
    console.error('Error retrieving checkout settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cache the response for 5 minutes to improve performance
export const revalidate = 300;