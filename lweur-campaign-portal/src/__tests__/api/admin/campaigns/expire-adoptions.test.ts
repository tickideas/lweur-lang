// src/__tests__/api/admin/campaigns/expire-adoptions.test.ts
// Tests for the campaign expiry API endpoint functionality
// Verifies that one-time language adoptions expire correctly and languages are released
// RELEVANT FILES: expire-adoptions/route.ts, create-intent/route.ts, auth.ts, prisma/schema.prisma

import { POST, GET } from '@/app/api/admin/campaigns/expire-adoptions/route';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    language: {
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}));

const mockVerifyAuth = verifyAuth as jest.MockedFunction<typeof verifyAuth>;
const mockPrisma = prisma as any;

const mockRequest = (body?: any) => {
  const request = {
    json: jest.fn().mockResolvedValue(body || {}),
    url: 'http://localhost:3000/api/admin/campaigns/expire-adoptions',
  } as any as NextRequest;
  return request;
};

describe('POST /api/admin/campaigns/expire-adoptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should require authentication', async () => {
    mockVerifyAuth.mockResolvedValue({ success: false, admin: null });

    const response = await POST(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should require admin permissions', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: true,
      admin: { id: 'admin-1', role: 'VIEWER' },
    });

    const response = await POST(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Insufficient permissions');
  });

  it('should process expired campaigns and release languages', async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

    mockVerifyAuth.mockResolvedValue({
      success: true,
      admin: { id: 'admin-1', role: 'SUPER_ADMIN' },
    });

    const expiredCampaign = {
      id: 'campaign-1',
      type: 'ADOPT_LANGUAGE',
      status: 'ACTIVE',
      languageId: 'lang-1',
      nextBillingDate: pastDate,
      stripeSubscriptionId: null,
      language: { id: 'lang-1', name: 'French', adoptionStatus: 'ADOPTED' },
      partner: { firstName: 'John', lastName: 'Doe' },
    };

    mockPrisma.campaign.findMany.mockResolvedValue([expiredCampaign]);
    mockPrisma.campaign.update.mockResolvedValue(expiredCampaign);
    
    // Mock that there are no other active campaigns for this language
    mockPrisma.campaign.findMany
      .mockResolvedValueOnce([expiredCampaign]) // First call for expired campaigns
      .mockResolvedValueOnce([]); // Second call for other active campaigns

    mockPrisma.language.update.mockResolvedValue({
      id: 'lang-1',
      adoptionStatus: 'AVAILABLE',
    });

    const response = await POST(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.expiredCampaigns).toBe(1);
    expect(data.results).toHaveLength(1);
    expect(data.results[0]).toMatchObject({
      campaignId: 'campaign-1',
      languageId: 'lang-1',
      languageName: 'French',
      partnerName: 'John Doe',
      action: 'RELEASED',
    });

    // Verify campaign was marked as completed
    expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
      data: {
        status: 'COMPLETED',
        endDate: expect.any(Date),
      },
    });

    // Verify language was released
    expect(mockPrisma.language.update).toHaveBeenCalledWith({
      where: { id: 'lang-1' },
      data: { adoptionStatus: 'AVAILABLE' },
    });
  });

  it('should not release language if other active campaigns exist', async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    mockVerifyAuth.mockResolvedValue({
      success: true,
      admin: { id: 'admin-1', role: 'CAMPAIGN_MANAGER' },
    });

    const expiredCampaign = {
      id: 'campaign-1',
      type: 'ADOPT_LANGUAGE',
      status: 'ACTIVE',
      languageId: 'lang-1',
      nextBillingDate: pastDate,
      stripeSubscriptionId: null,
      language: { id: 'lang-1', name: 'French', adoptionStatus: 'ADOPTED' },
      partner: { firstName: 'John', lastName: 'Doe' },
    };

    const otherActiveCampaign = {
      id: 'campaign-2',
      type: 'ADOPT_LANGUAGE',
      status: 'ACTIVE',
      languageId: 'lang-1',
    };

    mockPrisma.campaign.findMany
      .mockResolvedValueOnce([expiredCampaign]) // Expired campaigns
      .mockResolvedValueOnce([otherActiveCampaign]); // Other active campaigns

    mockPrisma.campaign.update.mockResolvedValue(expiredCampaign);

    const response = await POST(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results[0].action).toBe('CAMPAIGN_COMPLETED_BUT_LANGUAGE_STILL_ADOPTED');
    expect(data.results[0].otherActiveCampaigns).toBe(1);

    // Verify language was NOT released
    expect(mockPrisma.language.update).not.toHaveBeenCalled();
  });

  it('should handle no expired campaigns', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: true,
      admin: { id: 'admin-1', role: 'SUPER_ADMIN' },
    });

    mockPrisma.campaign.findMany.mockResolvedValue([]);

    const response = await POST(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.expiredCampaigns).toBe(0);
    expect(data.results).toHaveLength(0);
  });

  it('should handle errors gracefully', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: true,
      admin: { id: 'admin-1', role: 'SUPER_ADMIN' },
    });

    mockPrisma.campaign.findMany.mockRejectedValue(new Error('Database error'));

    const response = await POST(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('GET /api/admin/campaigns/expire-adoptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return campaigns expiring soon and this week', async () => {
    const now = new Date();
    const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    mockVerifyAuth.mockResolvedValue({
      success: true,
      admin: { id: 'admin-1', role: 'VIEWER' },
    });

    const expiringSoon = [{
      id: 'campaign-1',
      nextBillingDate: in12Hours,
      language: { name: 'French' },
      partner: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    }];

    const expiringThisWeek = [{
      id: 'campaign-2',
      nextBillingDate: in3Days,
      language: { name: 'German' },
      partner: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    }];

    mockPrisma.campaign.findMany
      .mockResolvedValueOnce(expiringSoon) // Expiring in 24 hours
      .mockResolvedValueOnce(expiringThisWeek); // Expiring this week

    const response = await GET(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.expiringSoon).toHaveLength(1);
    expect(data.expiringThisWeek).toHaveLength(1);
    expect(data.expiringSoon[0]).toMatchObject({
      campaignId: 'campaign-1',
      languageName: 'French',
      partnerName: 'John Doe',
      partnerEmail: 'john@example.com',
      hoursUntilExpiry: expect.any(Number),
    });
  });

  it('should require authentication for GET requests', async () => {
    mockVerifyAuth.mockResolvedValue({ success: false, admin: null });

    const response = await GET(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });
});