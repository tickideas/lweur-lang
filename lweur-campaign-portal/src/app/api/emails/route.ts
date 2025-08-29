import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const emailService = new EmailService();

export async function POST(request: NextRequest) {
  try {
    const { type, partnerId, data } = await request.json();

    // Validate required fields
    if (!type || !partnerId) {
      return NextResponse.json(
        { error: 'Missing required fields: type and partnerId' },
        { status: 400 }
      );
    }

    // Get partner information
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        language: true,
        campaign: true,
      },
    });

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    let result;

    switch (type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail(partner);
        break;

      case 'payment_confirmation':
        if (!data?.amount || !data?.currency) {
          return NextResponse.json(
            { error: 'Payment amount and currency required for payment confirmation' },
            { status: 400 }
          );
        }
        result = await emailService.sendPaymentConfirmation(partner, data.amount, data.currency);
        break;

      case 'payment_failed':
        if (!data?.amount || !data?.currency) {
          return NextResponse.json(
            { error: 'Payment amount and currency required for payment failed notification' },
            { status: 400 }
          );
        }
        result = await emailService.sendPaymentFailed(partner, data.amount, data.currency);
        break;

      case 'monthly_impact':
        if (!data?.stats) {
          return NextResponse.json(
            { error: 'Impact statistics required for monthly impact email' },
            { status: 400 }
          );
        }
        result = await emailService.sendMonthlyImpactReport(partner, data.stats);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    // Log the email communication
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
      message: result.message,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

function getEmailSubject(type: string, partner: any): string {
  switch (type) {
    case 'welcome':
      return `Welcome to Loveworld Europe - ${partner.campaign.name} Partnership`;
    case 'payment_confirmation':
      return 'Thank you for your partnership - Payment Confirmation';
    case 'payment_failed':
      return 'Payment Update Required - Loveworld Europe';
    case 'monthly_impact':
      return 'Your Monthly Impact Report - Loveworld Europe';
    default:
      return 'Loveworld Europe Update';
  }
}

// GET endpoint for email templates preview (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const template = searchParams.get('template');
    const partnerId = searchParams.get('partnerId');

    if (!template) {
      return NextResponse.json(
        { error: 'Template parameter required' },
        { status: 400 }
      );
    }

    // This would be used by admins to preview email templates
    // For security, you might want to add authentication check here
    
    let sampleData;
    if (partnerId) {
      sampleData = await prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
          language: true,
          campaign: true,
        },
      });
    }

    const emailService = new EmailService();
    const templateContent = emailService.getEmailTemplate(template, sampleData);

    return NextResponse.json({
      template: template,
      content: templateContent,
    });

  } catch (error) {
    console.error('Email template preview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate template preview' },
      { status: 500 }
    );
  }
}