// src/app/api/hero-settings/route.ts
// Public API endpoint for fetching checkout hero section settings
// Used by the checkout page to display hero section
// RELEVANT FILES: checkout-wizard.tsx, admin/hero-settings/route.ts, prisma/schema.prisma

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const defaultHeroSettings = {
  heroEnabled: true,
  heroTitle: "YOU'RE A\nWORLD\nCHANGER",
  heroSubtitle: 'Your generosity is transforming lives across Europe',
  heroBackgroundColor: 'from-[#1226AA] to-blue-800',
  heroTextColor: 'text-white',
};

// GET /api/hero-settings - Fetch current hero settings (public endpoint)
export async function GET() {
  try {
    const settings = await prisma.checkoutSettings.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        heroEnabled: true,
        heroTitle: true,
        heroSubtitle: true,
        heroBackgroundColor: true,
        heroTextColor: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: settings ?? defaultHeroSettings
    });
  } catch (error) {
    console.error('Error fetching hero settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hero settings' },
      { status: 500 }
    );
  }
}

export const revalidate = 300;
