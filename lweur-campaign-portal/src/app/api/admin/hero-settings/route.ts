// src/app/api/admin/hero-settings/route.ts
// API endpoints for managing checkout hero section settings
// Handles GET and PUT requests for hero configuration
// RELEVANT FILES: checkout-wizard.tsx, admin/settings/page.tsx, prisma/schema.prisma, middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for hero settings validation
const heroSettingsSchema = z.object({
  heroEnabled: z.boolean(),
  heroTitle: z.string().min(1, 'Hero title is required'),
  heroSubtitle: z.string().min(1, 'Hero subtitle is required'),
  heroBackgroundColor: z.string().min(1, 'Background color is required'),
  heroTextColor: z.string().min(1, 'Text color is required'),
});

// GET /api/admin/hero-settings - Fetch current hero settings
export async function GET(request: NextRequest) {
  try {
    // Get or create checkout settings
    let settings = await prisma.checkoutSettings.findFirst();
    
    if (!settings) {
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

// PUT /api/admin/hero-settings - Update hero settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validatedData = heroSettingsSchema.parse(body);
    
    // Get or create checkout settings
    let settings = await prisma.checkoutSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.checkoutSettings.create({
        data: validatedData
      });
    } else {
      settings = await prisma.checkoutSettings.update({
        where: { id: settings.id },
        data: validatedData
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
      data: heroSettings,
      message: 'Hero settings updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid data',
          details: error.issues 
        },
        { status: 400 }
      );
    }
    
    console.error('Error updating hero settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update hero settings' },
      { status: 500 }
    );
  }
}