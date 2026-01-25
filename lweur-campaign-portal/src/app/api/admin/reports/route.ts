import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'CAMPAIGN_MANAGER', 'FINANCE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const format_type = searchParams.get('format') || 'json';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let data;
    let filename = '';

    switch (reportType) {
      case 'partners':
        data = await generatePartnersReport(startDate, endDate);
        filename = `partners-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      
      case 'campaigns':
        data = await generateCampaignsReport(startDate, endDate);
        filename = `campaigns-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      
      case 'payments':
        data = await generatePaymentsReport(startDate, endDate);
        filename = `payments-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      
      case 'languages':
        data = await generateLanguagesReport();
        filename = `languages-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      
      case 'dashboard':
        data = await generateDashboardReport();
        filename = `dashboard-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (format_type === 'csv') {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ data, generated_at: new Date().toISOString() });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

async function generatePartnersReport(startDate?: string | null, endDate?: string | null) {
  const whereClause: any = {};
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const partners = await prisma.partner.findMany({
    where: whereClause,
    include: {
      campaigns: {
        include: {
          language: true,
        },
      },
      payments: true,
      _count: {
        select: {
          campaigns: true,
          payments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return partners.map(partner => ({
    id: partner.id,
    email: partner.email,
    firstName: partner.firstName,
    lastName: partner.lastName,
    organization: partner.organization || '',
    country: partner.country,
    preferredLanguage: partner.preferredLanguage,
    joinedDate: format(partner.createdAt, 'yyyy-MM-dd'),
    activeCampaigns: partner._count.campaigns,
    totalPayments: partner._count.payments,
    totalSpent: partner.payments.reduce((sum, payment) => 
      payment.status === 'SUCCEEDED' ? sum + payment.amount : sum, 0) / 100,
    languages: partner.campaigns.map(c => c.language.name).join('; '),
    campaignTypes: partner.campaigns.map(c => c.type).join('; '),
  }));
}

async function generateCampaignsReport(startDate?: string | null, endDate?: string | null) {
  const whereClause: any = {};
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const campaigns = await prisma.campaign.findMany({
    where: whereClause,
    include: {
      partner: true,
      language: true,
      payments: true,
      _count: {
        select: {
          payments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return campaigns.map(campaign => ({
    id: campaign.id,
    type: campaign.type,
    status: campaign.status,
    partnerName: `${campaign.partner.firstName} ${campaign.partner.lastName}`,
    partnerEmail: campaign.partner.email,
    partnerOrganization: campaign.partner.organization || '',
    languageName: campaign.language.name,
    languageRegion: campaign.language.region,
    monthlyAmount: campaign.monthlyAmount / 100,
    currency: campaign.currency,
    startDate: format(campaign.createdAt, 'yyyy-MM-dd'),
    endDate: campaign.endDate ? format(campaign.endDate, 'yyyy-MM-dd') : '',
    nextBillingDate: campaign.nextBillingDate ? format(campaign.nextBillingDate, 'yyyy-MM-dd') : '',
    totalPayments: campaign._count.payments,
    totalRevenue: campaign.payments.reduce((sum, payment) => 
      payment.status === 'SUCCEEDED' ? sum + payment.amount : sum, 0) / 100,
  }));
}

async function generatePaymentsReport(startDate?: string | null, endDate?: string | null) {
  const whereClause: any = {};
  
  if (startDate && endDate) {
    whereClause.paymentDate = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const payments = await prisma.payment.findMany({
    where: whereClause,
    include: {
      partner: true,
      campaign: {
        include: {
          language: true,
        },
      },
    },
    orderBy: { paymentDate: 'desc' },
  });

  return payments.map(payment => ({
    id: payment.id,
    partnerName: `${payment.partner.firstName} ${payment.partner.lastName}`,
    partnerEmail: payment.partner.email,
    campaignType: payment.campaign.type,
    languageName: payment.campaign.language.name,
    amount: payment.amount / 100,
    currency: payment.currency,
    status: payment.status,
    paymentDate: format(payment.paymentDate, 'yyyy-MM-dd HH:mm:ss'),
    stripePaymentIntentId: payment.stripePaymentIntentId || '',
    stripeInvoiceId: payment.stripeInvoiceId || '',
    failureReason: payment.failureReason || '',
  }));
}

async function generateLanguagesReport() {
  const languages = await prisma.language.findMany({
    include: {
      campaigns: {
        include: {
          partner: true,
          payments: true,
        },
      },
      _count: {
        select: {
          campaigns: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return languages.map(language => ({
    id: language.id,
    name: language.name,
    code: language.iso639Code,
    region: language.region,
    speakerCount: language.speakerCount,
    adoptionStatus: language.adoptionStatus,
    activeCampaigns: language._count.campaigns,
    totalRevenue: language.campaigns.reduce((total, campaign) => 
      total + campaign.payments.reduce((sum, payment) => 
        payment.status === 'SUCCEEDED' ? sum + payment.amount : sum, 0), 0) / 100,
    adoptedBy: language.campaigns.find(c => c.type === 'ADOPT_LANGUAGE')?.partner 
      ? `${language.campaigns.find(c => c.type === 'ADOPT_LANGUAGE')?.partner.firstName} ${language.campaigns.find(c => c.type === 'ADOPT_LANGUAGE')?.partner.lastName}`
      : '',
    translationSponsors: language.campaigns.filter(c => c.type === 'SPONSOR_TRANSLATION').length,
  }));
}

async function generateDashboardReport() {
  const [
    totalPartners,
    totalCampaigns,
    totalRevenue,
    activeCampaigns,
    adoptedLanguages,
    sponsoredTranslations,
    recentPayments,
  ] = await Promise.all([
    prisma.partner.count(),
    prisma.campaign.count(),
    prisma.payment.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true },
    }),
    prisma.campaign.count({ where: { status: 'ACTIVE' } }),
    prisma.language.count({ where: { adoptionStatus: 'ADOPTED' } }),
    prisma.campaign.count({ where: { type: 'SPONSOR_TRANSLATION', status: 'ACTIVE' } }),
    prisma.payment.count({
      where: {
        paymentDate: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
        status: 'SUCCEEDED',
      },
    }),
  ]);

  return {
    overview: {
      totalPartners,
      totalCampaigns,
      totalRevenue: (totalRevenue._sum.amount || 0) / 100,
      activeCampaigns,
      adoptedLanguages,
      sponsoredTranslations,
      recentPayments,
    },
    generatedAt: new Date().toISOString(),
  };
}

function convertToCSV(inputData: unknown): string {
  if (!inputData) {
    return '';
  }

  // Normalize data to array format
  let data: Record<string, unknown>[];
  
  if (Array.isArray(inputData)) {
    if (inputData.length === 0) return '';
    data = inputData as Record<string, unknown>[];
  } else if (typeof inputData === 'object') {
    const obj = inputData as Record<string, unknown>;
    // Handle nested objects like dashboard report
    if ('overview' in obj && typeof obj.overview === 'object') {
      data = [obj.overview as Record<string, unknown>];
    } else {
      data = [obj];
    }
  } else {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    ),
  ].join('\n');

  return csvContent;
}