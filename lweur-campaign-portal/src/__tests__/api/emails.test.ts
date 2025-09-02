import { POST } from '@/app/api/emails/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email'

// Mock dependencies
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
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

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/emails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        firstName: 'Admin',
        lastName: 'User',
      },
    }

    const mockPartner = {
      id: 'partner-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      language: {
        id: 'lang-123',
        name: 'German',
      },
      campaign: {
        id: 'campaign-123',
        name: 'Language Adoption',
        type: 'ADOPT_LANGUAGE',
      },
    }

    it('should send welcome email successfully', async () => {
      // Mock authentication
      mockGetServerSession.mockResolvedValue(mockSession as any)

      // Mock partner lookup
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      // Mock email service
      const mockEmailService = {
        sendWelcomeEmail: jest.fn().mockResolvedValue({
          success: true,
          message: 'Email sent successfully',
          messageId: 'msg-123',
        }),
      }
      ;(EmailService as jest.Mock).mockImplementation(() => mockEmailService)

      // Mock communication logging
      mockPrisma.communication.create.mockResolvedValue({} as any)

      const payload = {
        type: 'welcome',
        partnerId: 'partner-123',
      }

      const request = new NextRequest('http://localhost:3000/api/emails', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toMatchObject({
        success: true,
        message: 'Email sent successfully',
        messageId: 'msg-123',
      })

      // Verify email service was called
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(mockPartner)

      // Verify communication was logged
      expect(mockPrisma.communication.create).toHaveBeenCalledWith({
        data: {
          partnerId: 'partner-123',
          type: 'EMAIL',
          subject: 'Welcome to Loveworld Europe - Language Adoption Partnership',
          content: 'Email sent: welcome',
          sentAt: expect.any(Date),
          status: 'SENT',
        },
      })
    })

    it('should send payment confirmation email with amount data', async () => {
      // Mock authentication
      mockGetServerSession.mockResolvedValue(mockSession as any)

      // Mock partner lookup
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      // Mock email service
      const mockEmailService = {
        sendPaymentConfirmation: jest.fn().mockResolvedValue({
          success: true,
          message: 'Payment confirmation sent',
          messageId: 'msg-456',
        }),
      }
      ;(EmailService as jest.Mock).mockImplementation(() => mockEmailService)

      // Mock communication logging
      mockPrisma.communication.create.mockResolvedValue({} as any)

      const payload = {
        type: 'payment_confirmation',
        partnerId: 'partner-123',
        data: {
          amount: 150.00,
          currency: 'GBP',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/emails', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify email service was called with correct parameters
      expect(mockEmailService.sendPaymentConfirmation).toHaveBeenCalledWith(
        mockPartner,
        150.00,
        'GBP'
      )
    })

    it('should send payment failed email', async () => {
      // Mock authentication
      mockGetServerSession.mockResolvedValue(mockSession as any)

      // Mock partner lookup
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      // Mock email service
      const mockEmailService = {
        sendPaymentFailed: jest.fn().mockResolvedValue({
          success: true,
          message: 'Payment failed notification sent',
          messageId: 'msg-789',
        }),
      }
      ;(EmailService as jest.Mock).mockImplementation(() => mockEmailService)

      // Mock communication logging
      mockPrisma.communication.create.mockResolvedValue({} as any)

      const payload = {
        type: 'payment_failed',
        partnerId: 'partner-123',
        data: {
          amount: 150.00,
          currency: 'GBP',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/emails', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify email service was called with correct parameters
      expect(mockEmailService.sendPaymentFailed).toHaveBeenCalledWith(
        mockPartner,
        150.00,
        'GBP'
      )
    })

    it('should send monthly impact report with stats', async () => {
      // Mock authentication
      mockGetServerSession.mockResolvedValue(mockSession as any)

      // Mock partner lookup
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      // Mock email service
      const mockEmailService = {
        sendMonthlyImpactReport: jest.fn().mockResolvedValue({
          success: true,
          message: 'Monthly report sent',
          messageId: 'msg-101',
        }),
      }
      ;(EmailService as jest.Mock).mockImplementation(() => mockEmailService)

      // Mock communication logging
      mockPrisma.communication.create.mockResolvedValue({} as any)

      const impactStats = {
        totalViewers: 150000,
        languagesReached: 45,
        partnersCount: 25,
        monthlyGrowth: 12.5,
      }

      const payload = {
        type: 'monthly_impact',
        partnerId: 'partner-123',
        data: {
          stats: impactStats,
        },
      }

      const request = new NextRequest('http://localhost:3000/api/emails', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify email service was called with correct parameters
      expect(mockEmailService.sendMonthlyImpactReport).toHaveBeenCalledWith(
        mockPartner,
        impactStats
      )
    })

    it('should return 401 for unauthorized requests', async () => {
      // Mock no session
      mockGetServerSession.mockResolvedValue(null)

      const payload = {
        type: 'welcome',
        partnerId: 'partner-123',
      }

      const request = new NextRequest('http://localhost:3000/api/emails', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should return 400 for missing required fields', async () => {
      // Mock authentication
      mockGetServerSession.mockResolvedValue(mockSession as any)

      const payload = {
        type: 'welcome',
        // Missing partnerId
      }

      const request = new NextRequest('http://localhost:3000/api/emails', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Missing required fields: type and partnerId')
    })

    it('should return 404 for partner not found', async () => {
      // Mock authentication
      mockGetServerSession.mockResolvedValue(mockSession as any)

      // Mock partner not found
      mockPrisma.partner.findUnique.mockResolvedValue(null)

      const payload = {
        type: 'welcome',
        partnerId: 'nonexistent-partner',
      }

      const request = new NextRequest('http://localhost:3000/api/emails', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('Partner not found')
    })

    it('should return 400 for invalid email type', async () => {
      // Mock authentication
      mockGetServerSession.mockResolvedValue(mockSession as any)

      // Mock partner lookup
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      const payload = {
        type: 'invalid_type',
        partnerId: 'partner-123',
      }

      const request = new NextRequest('http://localhost:3000/api/emails', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid email type')
    })

    it('should return 400 for missing required data fields', async () => {
      // Mock authentication
      mockGetServerSession.mockResolvedValue(mockSession as any)

      // Mock partner lookup
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      const payload = {
        type: 'payment_confirmation',
        partnerId: 'partner-123',
        // Missing required data.amount and data.currency
      }

      const request = new NextRequest('http://localhost:3000/api/emails', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Payment amount and currency required for payment confirmation')
    })

    it('should handle email service failures gracefully', async () => {
      // Mock authentication
      mockGetServerSession.mockResolvedValue(mockSession as any)

      // Mock partner lookup
      mockPrisma.partner.findUnique.mockResolvedValue(mockPartner as any)

      // Mock email service failure
      const mockEmailService = {
        sendWelcomeEmail: jest.fn().mockResolvedValue({
          success: false,
          message: 'Email service temporarily unavailable',
        }),
      }
      ;(EmailService as jest.Mock).mockImplementation(() => mockEmailService)

      // Mock communication logging
      mockPrisma.communication.create.mockResolvedValue({} as any)

      const payload = {
        type: 'welcome',
        partnerId: 'partner-123',
      }

      const request = new NextRequest('http://localhost:3000/api/emails', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Email service temporarily unavailable')

      // Verify communication was logged with FAILED status
      expect(mockPrisma.communication.create).toHaveBeenCalledWith({
        data: {
          partnerId: 'partner-123',
          type: 'EMAIL',
          subject: 'Welcome to Loveworld Europe - Language Adoption Partnership',
          content: 'Email sent: welcome',
          sentAt: expect.any(Date),
          status: 'FAILED',
        },
      })
    })
  })
})