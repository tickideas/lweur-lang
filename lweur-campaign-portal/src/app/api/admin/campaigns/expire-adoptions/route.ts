// src/app/api/admin/campaigns/expire-adoptions/route.ts
// API endpoint to handle expiry of one-time language adoptions
// Checks for campaigns that have passed their nextBillingDate and releases the languages
// RELEVANT FILES: create-intent/route.ts, schema.prisma, adopt-language/page.tsx, languages/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth';

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

    // Check for admin permissions (only SUPER_ADMIN and CAMPAIGN_MANAGER can run this)
    if (!['SUPER_ADMIN', 'CAMPAIGN_MANAGER'].includes(authResult.admin.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const now = new Date();
    
    // Find all one-time language adoption campaigns that have expired
    const expiredCampaigns = await prisma.campaign.findMany({
      where: {
        type: 'ADOPT_LANGUAGE',
        status: 'ACTIVE',
        stripeSubscriptionId: null, // One-time payments don't have subscription IDs
        nextBillingDate: {
          lte: now // Next billing date is in the past
        }
      },
      include: {
        language: true,
        partner: true
      }
    });

    const results = [];

    for (const campaign of expiredCampaigns) {
      try {
        // Set campaign status to COMPLETED
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { 
            status: 'COMPLETED',
            endDate: now
          }
        });

        // Check if this language has any other active adoption campaigns
        const otherActiveCampaigns = await prisma.campaign.findMany({
          where: {
            languageId: campaign.languageId,
            type: 'ADOPT_LANGUAGE',
            status: 'ACTIVE',
            id: { not: campaign.id }
          }
        });

        // If no other active campaigns, release the language for adoption
        if (otherActiveCampaigns.length === 0) {
          await prisma.language.update({
            where: { id: campaign.languageId },
            data: { adoptionStatus: 'AVAILABLE' }
          });

          results.push({
            campaignId: campaign.id,
            languageId: campaign.languageId,
            languageName: campaign.language.name,
            partnerName: `${campaign.partner.firstName} ${campaign.partner.lastName}`,
            action: 'RELEASED',
            expiredDate: campaign.nextBillingDate
          });
        } else {
          results.push({
            campaignId: campaign.id,
            languageId: campaign.languageId,
            languageName: campaign.language.name,
            partnerName: `${campaign.partner.firstName} ${campaign.partner.lastName}`,
            action: 'CAMPAIGN_COMPLETED_BUT_LANGUAGE_STILL_ADOPTED',
            expiredDate: campaign.nextBillingDate,
            otherActiveCampaigns: otherActiveCampaigns.length
          });
        }

      } catch (error) {
        console.error(`Error processing expired campaign ${campaign.id}:`, error);
        results.push({
          campaignId: campaign.id,
          languageId: campaign.languageId,
          languageName: campaign.language.name,
          action: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedAt: now,
      expiredCampaigns: results.length,
      results
    });

  } catch (error) {
    console.error('Error processing campaign expirations:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check for campaigns that will expire soon (for monitoring)
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

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find campaigns expiring in the next 24 hours
    const expiringSoon = await prisma.campaign.findMany({
      where: {
        type: 'ADOPT_LANGUAGE',
        status: 'ACTIVE',
        stripeSubscriptionId: null,
        nextBillingDate: {
          lte: in24Hours,
          gte: now
        }
      },
      include: {
        language: true,
        partner: true
      }
    });

    // Find campaigns expiring in the next 7 days
    const expiringThisWeek = await prisma.campaign.findMany({
      where: {
        type: 'ADOPT_LANGUAGE',
        status: 'ACTIVE',
        stripeSubscriptionId: null,
        nextBillingDate: {
          lte: in7Days,
          gte: in24Hours
        }
      },
      include: {
        language: true,
        partner: true
      }
    });

    return NextResponse.json({
      success: true,
      checkedAt: now,
      expiringSoon: expiringSoon.map(campaign => ({
        campaignId: campaign.id,
        languageName: campaign.language.name,
        partnerName: `${campaign.partner.firstName} ${campaign.partner.lastName}`,
        partnerEmail: campaign.partner.email,
        expiryDate: campaign.nextBillingDate,
        hoursUntilExpiry: campaign.nextBillingDate 
          ? Math.ceil((campaign.nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60))
          : null
      })),
      expiringThisWeek: expiringThisWeek.map(campaign => ({
        campaignId: campaign.id,
        languageName: campaign.language.name,
        partnerName: `${campaign.partner.firstName} ${campaign.partner.lastName}`,
        partnerEmail: campaign.partner.email,
        expiryDate: campaign.nextBillingDate,
        daysUntilExpiry: campaign.nextBillingDate 
          ? Math.ceil((campaign.nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null
      }))
    });

  } catch (error) {
    console.error('Error checking campaign expirations:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}