import { POST } from '@/app/api/webhooks/stripe/route'
import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

// Mock dependencies
jest.mock('@/lib/stripe')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    communication: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/email', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendPaymentConfirmation: jest.fn().mockResolvedValue({ success: true }),
    sendPaymentFailed: jest.fn().mockResolvedValue({ success: true }),
  })),
}))

jest.mock('next/headers', () => ({
  headers: () => ({
    get: jest.fn().mockReturnValue('test_webhook_signature'),
  }),
}))

const mockStripe = stripe as jest.Mocked<typeof stripe>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/webhooks/stripe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123'
  })

  describe('POST', () => {
    it('should handle invoice.payment_succeeded event', async () => {
      const mockInvoice = {
        id: 'in_test123',
        subscription: 'sub_test123',
        amount_paid: 15000, // £150 in pence
        currency: 'gbp',
        payment_intent: 'pi_test123',
        created: Math.floor(Date.now() / 1000),
        period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days from now
      }

      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: mockInvoice,
        },
      }

      // Mock webhook signature verification
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      // Mock campaign lookup
      const mockCampaign = {
        id: 'campaign-123',
        partnerId: 'partner-123',
        partner: {
          id: 'partner-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        language: {
          id: 'lang-123',
          name: 'German',
        },
      }
      mockPrisma.campaign.findFirst.mockResolvedValue(mockCampaign as any)

      // Mock payment creation
      mockPrisma.payment.create.mockResolvedValue({} as any)

      // Mock campaign update
      mockPrisma.campaign.update.mockResolvedValue({} as any)

      // Mock communication logging
      mockPrisma.communication.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.received).toBe(true)

      // Verify payment record creation
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: {
          campaignId: 'campaign-123',
          partnerId: 'partner-123',
          amount: 15000,
          currency: 'GBP',
          stripePaymentIntentId: 'pi_test123',
          stripeInvoiceId: 'in_test123',
          status: 'SUCCEEDED',
          paymentDate: expect.any(Date),
        },
      })

      // Verify campaign update
      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-123' },
        data: {
          nextBillingDate: expect.any(Date),
          status: 'ACTIVE',
        },
      })

      // Verify email communication was logged
      expect(mockPrisma.communication.create).toHaveBeenCalledWith({
        data: {
          partnerId: 'partner-123',
          type: 'EMAIL',
          subject: 'Thank you for your partnership - Payment Confirmation',
          content: 'Payment confirmation email sent for GBP 150.00',
          sentAt: expect.any(Date),
          status: 'SENT',
        },
      })
    })

    it('should handle invoice.payment_failed event', async () => {
      const mockInvoice = {
        id: 'in_test123',
        subscription: 'sub_test123',
        amount_due: 15000,
        currency: 'gbp',
        created: Math.floor(Date.now() / 1000),
      }

      const mockEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: mockInvoice,
        },
      }

      // Mock webhook signature verification
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      // Mock campaign lookup
      const mockCampaign = {
        id: 'campaign-123',
        partnerId: 'partner-123',
        partner: {
          id: 'partner-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        language: {
          id: 'lang-123',
          name: 'German',
        },
      }
      mockPrisma.campaign.findFirst.mockResolvedValue(mockCampaign as any)

      // Mock payment creation
      mockPrisma.payment.create.mockResolvedValue({} as any)

      // Mock communication logging
      mockPrisma.communication.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.received).toBe(true)

      // Verify failed payment record creation
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: {
          campaignId: 'campaign-123',
          partnerId: 'partner-123',
          amount: 15000,
          currency: 'GBP',
          stripeInvoiceId: 'in_test123',
          status: 'FAILED',
          paymentDate: expect.any(Date),
          failureReason: 'Payment failed',
        },
      })

      // Verify failed payment email communication was logged
      expect(mockPrisma.communication.create).toHaveBeenCalledWith({
        data: {
          partnerId: 'partner-123',
          type: 'EMAIL',
          subject: 'Payment Update Required - Loveworld Europe',
          content: 'Payment failed notification sent for GBP 150.00',
          sentAt: expect.any(Date),
          status: 'SENT',
        },
      })
    })

    it('should handle customer.subscription.updated event', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
      }

      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
        },
      }

      // Mock webhook signature verification
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      // Mock campaign lookup
      const mockCampaign = {
        id: 'campaign-123',
        stripeSubscriptionId: 'sub_test123',
      }
      mockPrisma.campaign.findFirst.mockResolvedValue(mockCampaign as any)

      // Mock campaign update
      mockPrisma.campaign.update.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.received).toBe(true)

      // Verify campaign status update
      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-123' },
        data: {
          status: 'ACTIVE',
          nextBillingDate: expect.any(Date),
        },
      })
    })

    it('should handle customer.subscription.deleted event', async () => {
      const mockSubscription = {
        id: 'sub_test123',
      }

      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: mockSubscription,
        },
      }

      // Mock webhook signature verification
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      // Mock campaign lookup
      const mockCampaign = {
        id: 'campaign-123',
        stripeSubscriptionId: 'sub_test123',
      }
      mockPrisma.campaign.findFirst.mockResolvedValue(mockCampaign as any)

      // Mock campaign update
      mockPrisma.campaign.update.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.received).toBe(true)

      // Verify campaign cancellation
      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-123' },
        data: {
          status: 'CANCELLED',
          endDate: expect.any(Date),
        },
      })
    })

    it('should return error for invalid webhook signature', async () => {
      // Mock signature verification failure
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'test.event' }),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid signature')
    })

    it('should handle campaign not found scenario gracefully', async () => {
      const mockInvoice = {
        id: 'in_test123',
        subscription: 'sub_nonexistent',
        amount_paid: 15000,
        currency: 'gbp',
        payment_intent: 'pi_test123',
        created: Math.floor(Date.now() / 1000),
      }

      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: mockInvoice,
        },
      }

      // Mock webhook signature verification
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      // Mock campaign not found
      mockPrisma.campaign.findFirst.mockResolvedValue(null)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.received).toBe(true)

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Campaign not found for subscription:',
        'sub_nonexistent'
      )

      // Verify no database operations were attempted
      expect(mockPrisma.payment.create).not.toHaveBeenCalled()
      expect(mockPrisma.campaign.update).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should handle unrecognized event types gracefully', async () => {
      const mockEvent = {
        type: 'unknown.event.type',
        data: {
          object: {},
        },
      }

      // Mock webhook signature verification
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.received).toBe(true)

      // Verify unhandled event was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unhandled event type: unknown.event.type'
      )

      consoleSpy.mockRestore()
    })
  })
})