// src/app/api/admin/checkout-settings/route.ts
// API route for managing checkout settings - GET and POST operations
// Handles creating, reading, and updating checkout configuration for admin users
// RELEVANT FILES: checkout-settings/page.tsx, prisma/schema.prisma, admin/reports/route.ts, auth.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth';
import { z } from 'zod';

const checkoutSettingsSchema = z.object({
  availableCurrencies: z.array(z.string()).min(1),
  defaultCurrency: z.string().min(1),
  adoptLanguageDefaultAmount: z.number().min(100),
  adoptLanguagePresetAmounts: z.array(z.number()).min(1),
  adoptLanguageMinAmount: z.number().min(100),
  adoptLanguageMaxAmount: z.number().min(1000),
  sponsorTranslationDefaultAmount: z.number().min(100),
  sponsorTranslationPresetAmounts: z.array(z.number()).min(1),
  sponsorTranslationMinAmount: z.number().min(100),
  sponsorTranslationMaxAmount: z.number().min(1000),
  showOneTimeOption: z.boolean(),
  requirePhone: z.boolean(),
  requireOrganization: z.boolean(),
  hearFromUsOptions: z.array(z.string()),
  checkoutTitle: z.string().min(1),
  checkoutSubtitle: z.string().min(1),
});

// GET - Retrieve checkout settings
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.isValid || !authResult.admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions (only SUPER_ADMIN and CAMPAIGN_MANAGER can access)
    if (!['SUPER_ADMIN', 'CAMPAIGN_MANAGER'].includes(authResult.admin.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get the first (and should be only) checkout settings record
    const settings = await prisma.checkoutSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!settings) {
      // Return default settings if none exist
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
        showOneTimeOption: false,
        requirePhone: false,
        requireOrganization: false,
        hearFromUsOptions: ['Search Engine', 'Social Media', 'Friend/Family', 'Church', 'Advertisement', 'Email', 'Other'],
        checkoutTitle: 'Your generosity is transforming lives!',
        checkoutSubtitle: 'Support Loveworld Europe\'s mission to reach every European language with the Gospel',
      };

      return NextResponse.json({
        success: true,
        settings: defaultSettings,
        isDefault: true
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
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
        showOneTimeOption: settings.showOneTimeOption,
        requirePhone: settings.requirePhone,
        requireOrganization: settings.requireOrganization,
        hearFromUsOptions: settings.hearFromUsOptions,
        checkoutTitle: settings.checkoutTitle,
        checkoutSubtitle: settings.checkoutSubtitle,
      },
      isDefault: false
    });

  } catch (error) {
    console.error('Error retrieving checkout settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update checkout settings
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.isValid || !authResult.admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions (only SUPER_ADMIN and CAMPAIGN_MANAGER can modify)
    if (!['SUPER_ADMIN', 'CAMPAIGN_MANAGER'].includes(authResult.admin.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validationResult = checkoutSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid data',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if settings already exist
    const existingSettings = await prisma.checkoutSettings.findFirst();

    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.checkoutSettings.update({
        where: { id: existingSettings.id },
        data: {
          availableCurrencies: data.availableCurrencies,
          defaultCurrency: data.defaultCurrency,
          adoptLanguageDefaultAmount: data.adoptLanguageDefaultAmount,
          adoptLanguagePresetAmounts: data.adoptLanguagePresetAmounts,
          adoptLanguageMinAmount: data.adoptLanguageMinAmount,
          adoptLanguageMaxAmount: data.adoptLanguageMaxAmount,
          sponsorTranslationDefaultAmount: data.sponsorTranslationDefaultAmount,
          sponsorTranslationPresetAmounts: data.sponsorTranslationPresetAmounts,
          sponsorTranslationMinAmount: data.sponsorTranslationMinAmount,
          sponsorTranslationMaxAmount: data.sponsorTranslationMaxAmount,
          showOneTimeOption: data.showOneTimeOption,
          requirePhone: data.requirePhone,
          requireOrganization: data.requireOrganization,
          hearFromUsOptions: data.hearFromUsOptions,
          checkoutTitle: data.checkoutTitle,
          checkoutSubtitle: data.checkoutSubtitle,
        },
      });
    } else {
      // Create new settings
      settings = await prisma.checkoutSettings.create({
        data: {
          availableCurrencies: data.availableCurrencies,
          defaultCurrency: data.defaultCurrency,
          adoptLanguageDefaultAmount: data.adoptLanguageDefaultAmount,
          adoptLanguagePresetAmounts: data.adoptLanguagePresetAmounts,
          adoptLanguageMinAmount: data.adoptLanguageMinAmount,
          adoptLanguageMaxAmount: data.adoptLanguageMaxAmount,
          sponsorTranslationDefaultAmount: data.sponsorTranslationDefaultAmount,
          sponsorTranslationPresetAmounts: data.sponsorTranslationPresetAmounts,
          sponsorTranslationMinAmount: data.sponsorTranslationMinAmount,
          sponsorTranslationMaxAmount: data.sponsorTranslationMaxAmount,
          showOneTimeOption: data.showOneTimeOption,
          requirePhone: data.requirePhone,
          requireOrganization: data.requireOrganization,
          hearFromUsOptions: data.hearFromUsOptions,
          checkoutTitle: data.checkoutTitle,
          checkoutSubtitle: data.checkoutSubtitle,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Checkout settings saved successfully',
      settings: {
        id: settings.id,
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
        showOneTimeOption: settings.showOneTimeOption,
        requirePhone: settings.requirePhone,
        requireOrganization: settings.requireOrganization,
        hearFromUsOptions: settings.hearFromUsOptions,
        checkoutTitle: settings.checkoutTitle,
        checkoutSubtitle: settings.checkoutSubtitle,
        updatedAt: settings.updatedAt,
      }
    });

  } catch (error) {
    console.error('Error saving checkout settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}