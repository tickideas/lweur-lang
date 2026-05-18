// src/app/api/emails/route.ts
// Authenticated admin API route for sending partner email templates on demand
// Exists so admins can trigger operational emails while preserving partner access control
// RELEVANT FILES: src/lib/auth.ts, src/lib/email.ts, prisma/schema.prisma, src/middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EmailService } from '@/lib/email';
import { verifyAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Campaign, Language, Partner } from '@/types';

const allowedRoles = ['SUPER_ADMIN', 'CAMPAIGN_MANAGER', 'FINANCE'] as const;

const emailRequestSchema = z.object({
  type: z.enum(['welcome', 'payment_confirmation', 'payment_failed', 'monthly_impact']),
  partnerId: z.string().min(1),
  data: z.object({
    amount: z.number().int().positive().optional(),
    currency: z.string().length(3).optional(),
    stats: z.unknown().optional(),
  }).optional(),
});

type EmailType = z.infer<typeof emailRequestSchema>['type'];
type CampaignWithLanguage = Campaign & { language: Language };
type PartnerWithCampaigns = Partner & { campaigns: CampaignWithLanguage[] };

async function requireEmailAdmin(request: NextRequest) {
  const authResult = await verifyAdminAuth(request);

  return !!authResult.admin && allowedRoles.includes(authResult.admin.role as (typeof allowedRoles)[number]);
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireEmailAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = emailRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { type, partnerId, data } = parsed.data;

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        campaigns: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { language: true },
        },
      },
    });

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    const result = await sendRequestedEmail(type, partner, data);
    if (result.success === false) {
      await prisma.communication.create({
        data: {
          partnerId: partner.id,
          type: 'EMAIL',
          subject: getEmailSubject(type, partner),
          content: `Email sent: ${type}`,
          sentAt: new Date(),
          status: 'FAILED',
        },
      });

      return NextResponse.json(result);
    }

    await prisma.communication.create({
      data: {
        partnerId: partner.id,
        type: 'EMAIL',
        subject: getEmailSubject(type, partner),
        content: `Email sent: ${type}`,
        sentAt: new Date(),
        status: result.success ? 'SENT' : 'FAILED',
      },
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Email API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send email';
    const status = message.includes('required') || message.includes('has no campaign') ? 400 : 500;

    return NextResponse.json(
      { error: status === 400 ? message : 'Failed to send email' },
      { status }
    );
  }
}

async function sendRequestedEmail(
  type: EmailType,
  partner: PartnerWithCampaigns,
  data: z.infer<typeof emailRequestSchema>['data']
) {
  const emailService = new EmailService();
  const campaign = partner.campaigns[0];

  switch (type) {
    case 'welcome':
      if (!campaign) {
        throw new Error('Partner has no campaign for welcome email');
      }
      return emailService.sendWelcomeEmail(partner, campaign);

    case 'payment_confirmation':
      if (!data?.amount || !data.currency) {
        throw new Error('Payment amount and currency required for payment confirmation');
      }
      return emailService.sendPaymentConfirmation(partner, data.amount, data.currency);

    case 'payment_failed':
      return emailService.sendPaymentFailed(partner);

    case 'monthly_impact':
      if (!campaign) {
        throw new Error('Partner has no campaign for monthly impact email');
      }
      return emailService.sendMonthlyImpactReport(partner, campaign);
  }
}

function getEmailSubject(type: EmailType, partner: PartnerWithCampaigns): string {
  switch (type) {
    case 'welcome': {
      const campaign = partner.campaigns[0];
      return campaign
        ? `Welcome to Loveworld Europe - ${campaign.language.name} ${campaign.type} Partnership`
        : 'Welcome to Loveworld Europe';
    }
    case 'payment_confirmation':
      return 'Thank you for your partnership - Payment Confirmation';
    case 'payment_failed':
      return 'Payment Update Required - Loveworld Europe';
    case 'monthly_impact':
      return 'Your Monthly Impact Report - Loveworld Europe';
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireEmailAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    templates: ['welcome', 'payment_confirmation', 'payment_failed', 'monthly_impact'],
  });
}
