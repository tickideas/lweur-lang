// src/app/api/hero-settings/route.ts
// Public API endpoint for fetching checkout hero section settings
// Used by the checkout page to display hero section
// RELEVANT FILES: checkout-wizard.tsx, admin/hero-settings/route.ts, prisma/schema.prisma

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/hero-settings - Fetch current hero settings (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Get checkout settings
    let settings = await prisma.checkoutSettings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.checkoutSettings.create({
        data: {}
      });
    }

    const heroSettings = {
      heroEnabled: settings.heroEnabled,
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
      heroBackgroundColor: settings.heroBackgroundColor,
      heroTextColor: settings.heroTextColor,
    };

    return NextResponse.json({
      success: true,
      data: heroSettings
    });
  } catch (error) {
    console.error('Error fetching hero settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hero settings' },
      { status: 500 }
    );
  }
}