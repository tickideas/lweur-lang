// src/__tests__/api/emails.test.ts
// Tests for authenticated email API route
// Verifies admin auth, validation, email dispatch, and communication logging
// RELEVANT FILES: src/app/api/emails/route.ts, src/lib/auth.ts, src/lib/email.ts, src/lib/prisma.ts

import { POST } from '@/app/api/emails/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'
import { EmailService } from '@/lib/email'

jest.mock('@/lib/auth', () => ({
  verifyAdminAuth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    partner: {
      findUnique: jest.fn(),
    },
    communication: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/email', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendWelcomeEmail: jest.fn(),
    sendPaymentConfirmation: jest.fn(),
    sendPaymentFailed: jest.fn(),
    sendMonthlyImpactReport: jest.fn(),
  })),
}))

const mockVerifyAdminAuth = verifyAdminAuth as jest.MockedFunction<typeof verifyAdminAuth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

const mockAdmin = {
  id: 'admin-123',
  email: 'admin@example.com',
  role: 'SUPER_ADMIN' as const,
  firstName: 'Admin',
  lastName: 'User',
}

const mockCampaign = {
  id: 'campaign-123',
  type: 'ADOPT_LANGUAGE' as const,
  partnerId: 'partner-123',
  languageId: 'lang-123',
  monthlyAmount: 15000,
  currency: 'GBP',
  startDate: new Date(),
  status: 'ACTIVE' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  language: {
    id: 'lang-123',
    name: 'German',
    nativeName: 'Deutsch',
    iso639Code: 'de',
    region: 'Western Europe',
    countries: ['DE'],
    speakerCount: 83000000,
    flagUrl: '/flags/de.svg',
    isActive: true,
    adoptionStatus: 'AVAILABLE' as const,
    translationNeedsSponsorship: true,
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

const mockPartner = {
  id: 'partner-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phoneNumber: null,
  organization: null,
  country: 'GB',
  preferredLanguage: 'en',
  createdAt: new Date(),
  updatedAt: new Date(),
  stripeCustomerId: null,
  isActive: true,
  campaigns: [mockCampaign],
}

function authAsAdmin() {
  mockVerifyAdminAuth.mockResolvedValue({ isValid: true, admin: mockAdmin } as any)
}

function request(payload: unknown) {
  return new NextRequest('http://localhost:3000/api/emails', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

describe('/api/emails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should send welcome email successfully', async () => {
      authAsAdmin()
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      const mockEmailService = {
        sendWelcomeEmail: jest.fn().mockResolvedValue({
          success: true,
          message: 'Email sent successfully',
          messageId: 'msg-123',
        }),
      }
      ;(EmailService as jest.Mock).mockImplementation(() => mockEmailService)
      mockPrisma.communication.create.mockResolvedValue({} as any)

      const response = await POST(request({ type: 'welcome', partnerId: 'partner-123' }))
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toMatchObject({ success: true, messageId: 'msg-123' })
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(mockPartner, mockCampaign)
      expect(mockPrisma.communication.create).toHaveBeenCalledWith({
        data: {
          partnerId: 'partner-123',
          type: 'EMAIL',
          subject: 'Welcome to Loveworld Europe - German ADOPT_LANGUAGE Partnership',
          content: 'Email sent: welcome',
          sentAt: expect.any(Date),
          status: 'SENT',
        },
      })
    })

    it('should send payment confirmation email with amount data', async () => {
      authAsAdmin()
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      const mockEmailService = {
        sendPaymentConfirmation: jest.fn().mockResolvedValue({
          success: true,
          messageId: 'msg-456',
        }),
      }
      ;(EmailService as jest.Mock).mockImplementation(() => mockEmailService)
      mockPrisma.communication.create.mockResolvedValue({} as any)

      const response = await POST(request({
        type: 'payment_confirmation',
        partnerId: 'partner-123',
        data: { amount: 150, currency: 'GBP' },
      }))
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(mockEmailService.sendPaymentConfirmation).toHaveBeenCalledWith(mockPartner, 150, 'GBP')
    })

    it('should send payment failed email', async () => {
      authAsAdmin()
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      const mockEmailService = {
        sendPaymentFailed: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-789' }),
      }
      ;(EmailService as jest.Mock).mockImplementation(() => mockEmailService)
      mockPrisma.communication.create.mockResolvedValue({} as any)

      const response = await POST(request({ type: 'payment_failed', partnerId: 'partner-123' }))
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(mockEmailService.sendPaymentFailed).toHaveBeenCalledWith(mockPartner)
    })

    it('should send monthly impact report with the latest campaign', async () => {
      authAsAdmin()
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      const mockEmailService = {
        sendMonthlyImpactReport: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-101' }),
      }
      ;(EmailService as jest.Mock).mockImplementation(() => mockEmailService)
      mockPrisma.communication.create.mockResolvedValue({} as any)

      const response = await POST(request({
        type: 'monthly_impact',
        partnerId: 'partner-123',
        data: { stats: { totalViewers: 150000 } },
      }))
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(mockEmailService.sendMonthlyImpactReport).toHaveBeenCalledWith(mockPartner, mockCampaign)
    })

    it('should return 401 for unauthorized requests', async () => {
      mockVerifyAdminAuth.mockResolvedValue({ isValid: false, admin: null } as any)

      const response = await POST(request({ type: 'welcome', partnerId: 'partner-123' }))
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 400 for missing required fields', async () => {
      authAsAdmin()

      const response = await POST(request({ type: 'welcome' }))
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid request data')
    })

    it('should return 404 for partner not found', async () => {
      authAsAdmin()
      mockPrisma.partner.findUnique.mockResolvedValue(null)

      const response = await POST(request({ type: 'welcome', partnerId: 'nonexistent-partner' }))
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('Partner not found')
    })

    it('should return 400 for invalid email type', async () => {
      authAsAdmin()

      const response = await POST(request({ type: 'invalid_type', partnerId: 'partner-123' }))
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid request data')
    })

    it('should return 400 for missing payment confirmation data', async () => {
      authAsAdmin()
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      const response = await POST(request({ type: 'payment_confirmation', partnerId: 'partner-123' }))
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Payment amount and currency required for payment confirmation')
    })

    it('should handle email service failures gracefully', async () => {
      authAsAdmin()
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      const mockEmailService = {
        sendWelcomeEmail: jest.fn().mockResolvedValue({
          success: false,
          message: 'Email service temporarily unavailable',
        }),
      }
      ;(EmailService as jest.Mock).mockImplementation(() => mockEmailService)
      mockPrisma.communication.create.mockResolvedValue({} as any)

      const response = await POST(request({ type: 'welcome', partnerId: 'partner-123' }))
      const responseData = await response.json()

      expect(response.status).toBe(502)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Email service temporarily unavailable')
      expect(mockPrisma.communication.create).toHaveBeenCalledWith({
        data: {
          partnerId: 'partner-123',
          type: 'EMAIL',
          subject: 'Welcome to Loveworld Europe - German ADOPT_LANGUAGE Partnership',
          content: 'Email sent: welcome',
          sentAt: expect.any(Date),
          status: 'FAILED',
        },
      })
    })
  })
})
