// src/__tests__/api/admin/checkout-settings.test.ts
// Tests for checkout settings API endpoints - GET and POST operations
// Verifies admin authentication, data validation, and CRUD functionality
// RELEVANT FILES: admin/checkout-settings/route.ts, auth.ts, prisma.ts, checkout-settings/page.tsx

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/checkout-settings/route';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    checkoutSettings: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyAdminAuth: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockVerifyAdminAuth = verifyAdminAuth as jest.MockedFunction<typeof verifyAdminAuth>;

const validCheckoutSettings = {
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
  hearFromUsOptions: ['Search Engine', 'Social Media', 'Friend/Family'],
  checkoutTitle: 'Your generosity is transforming lives!',
  checkoutSubtitle: 'Support our mission',
  // Hero section settings
  heroEnabled: true,
  heroTitle: "YOU'RE A\nWORLD\nCHANGER",
  heroSubtitle: "Your generosity is transforming lives across Europe",
  heroBackgroundColor: "from-[#1226AA] to-blue-800",
  heroTextColor: "text-white"
};

const mockSuperAdmin = {
  id: 'admin-1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'SUPER_ADMIN' as const,
  isActive: true,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockViewer = {
  ...mockSuperAdmin,
  role: 'VIEWER' as const,
};

describe('/api/admin/checkout-settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/checkout-settings', () => {
    test('returns unauthorized when admin auth fails', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: false,
        admin: null,
        error: 'Invalid token'
      });

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('returns forbidden for insufficient permissions', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockViewer,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });

    test('returns default settings when none exist in database', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      mockPrisma.checkoutSettings.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isDefault).toBe(true);
      expect(data.settings.defaultCurrency).toBe('GBP');
      expect(data.settings.adoptLanguageDefaultAmount).toBe(15000);
    });

    test('returns existing settings from database', async () => {
      const existingSettings = {
        id: 'settings-1',
        ...validCheckoutSettings,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      mockPrisma.checkoutSettings.findFirst.mockResolvedValue(existingSettings);

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isDefault).toBe(false);
      expect(data.settings.defaultCurrency).toBe('GBP');
      expect(data.settings.id).toBeUndefined(); // Should not expose internal ID
    });

    test('allows CAMPAIGN_MANAGER access', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: { ...mockSuperAdmin, role: 'CAMPAIGN_MANAGER' as const },
        error: null
      });

      mockPrisma.checkoutSettings.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    test('handles database errors', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      mockPrisma.checkoutSettings.findFirst.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/admin/checkout-settings', () => {
    test('returns unauthorized when admin auth fails', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: false,
        admin: null,
        error: 'Invalid token'
      });

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: JSON.stringify(validCheckoutSettings),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('returns forbidden for insufficient permissions', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockViewer,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: JSON.stringify(validCheckoutSettings),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });

    test('validates request data', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      const invalidData = {
        ...validCheckoutSettings,
        availableCurrencies: [], // Invalid: empty array
      };

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid data');
      expect(data.details).toBeDefined();
    });

    test('creates new settings when none exist', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      mockPrisma.checkoutSettings.findFirst.mockResolvedValue(null);
      mockPrisma.checkoutSettings.create.mockResolvedValue({
        id: 'new-settings-1',
        ...validCheckoutSettings,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: JSON.stringify(validCheckoutSettings),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Checkout settings saved successfully');
      expect(data.settings.id).toBe('new-settings-1');
      expect(mockPrisma.checkoutSettings.create).toHaveBeenCalledWith({
        data: validCheckoutSettings
      });
    });

    test('updates existing settings', async () => {
      const existingSettings = {
        id: 'existing-settings-1',
        ...validCheckoutSettings,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      mockPrisma.checkoutSettings.findFirst.mockResolvedValue(existingSettings);
      mockPrisma.checkoutSettings.update.mockResolvedValue({
        ...existingSettings,
        checkoutTitle: 'Updated Title',
        updatedAt: new Date(),
      });

      const updatedData = {
        ...validCheckoutSettings,
        checkoutTitle: 'Updated Title',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: JSON.stringify(updatedData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.settings.checkoutTitle).toBe('Updated Title');
      expect(mockPrisma.checkoutSettings.update).toHaveBeenCalledWith({
        where: { id: existingSettings.id },
        data: updatedData
      });
    });

    test('validates minimum amounts', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      const invalidData = {
        ...validCheckoutSettings,
        adoptLanguageMinAmount: 50, // Below minimum of 100
      };

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid data');
    });

    test('validates required fields', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      const invalidData = {
        ...validCheckoutSettings,
        checkoutTitle: '', // Required field empty
      };

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid data');
    });

    test('handles database errors during save', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      mockPrisma.checkoutSettings.findFirst.mockResolvedValue(null);
      mockPrisma.checkoutSettings.create.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: JSON.stringify(validCheckoutSettings),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    test('handles malformed JSON', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: 'invalid json',
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    test('allows CAMPAIGN_MANAGER to save settings', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: { ...mockSuperAdmin, role: 'CAMPAIGN_MANAGER' as const },
        error: null
      });

      mockPrisma.checkoutSettings.findFirst.mockResolvedValue(null);
      mockPrisma.checkoutSettings.create.mockResolvedValue({
        id: 'new-settings-1',
        ...validCheckoutSettings,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: JSON.stringify(validCheckoutSettings),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    test('validates hero section fields', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      const invalidData = {
        ...validCheckoutSettings,
        heroTitle: '', // Required field empty
      };

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid data');
    });

    test('validates hero field length limits', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      const invalidData = {
        ...validCheckoutSettings,
        heroTitle: 'A'.repeat(101), // Exceeds max length of 100
      };

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid data');
    });

    test('saves and retrieves hero section settings correctly', async () => {
      mockVerifyAdminAuth.mockResolvedValue({
        isValid: true,
        admin: mockSuperAdmin,
        error: null
      });

      const heroSettings = {
        heroEnabled: false,
        heroTitle: "Custom Title",
        heroSubtitle: "Custom Subtitle",
        heroBackgroundColor: "from-red-500 to-blue-500",
        heroTextColor: "text-black"
      };

      const settingsWithHero = {
        ...validCheckoutSettings,
        ...heroSettings
      };

      mockPrisma.checkoutSettings.findFirst.mockResolvedValue(null);
      mockPrisma.checkoutSettings.create.mockResolvedValue({
        id: 'new-settings-1',
        ...settingsWithHero,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/checkout-settings', {
        method: 'POST',
        body: JSON.stringify(settingsWithHero),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.settings.heroEnabled).toBe(false);
      expect(data.settings.heroTitle).toBe("Custom Title");
      expect(data.settings.heroBackgroundColor).toBe("from-red-500 to-blue-500");
    });
  });
});