import { POST } from '@/app/api/payments/create-intent/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    language: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    partner: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    campaign: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      list: jest.fn(),
      create: jest.fn(),
    },
    prices: {
      list: jest.fn(),
    },
    products: {
      create: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
    },
  },
  STRIPE_CONFIG: {
    MONTHLY_AMOUNT: 15000, // £150 in pence
    CURRENCY: 'gbp',
    PRODUCT_IDS: {
      ADOPT_LANGUAGE: 'prod_test_language',
      SPONSOR_TRANSLATION: 'prod_test_translation',
    },
  },
}))

jest.mock('@/lib/email', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  })),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockStripe = stripe as jest.Mocked<typeof stripe>

describe('/api/payments/create-intent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    const validPayload = {
      campaignType: 'ADOPT_LANGUAGE' as const,
      languageId: 'lang-123',
      amount: 15000,
      currency: 'GBP',
      isRecurring: true,
      partnerInfo: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+441234567890',
        organization: 'Test Org',
        country: 'GB',
        preferredLanguage: 'en',
      },
      billingAddress: {
        country: 'GB',
      },
    }

    it('should create payment intent for new partner and language adoption', async () => {
      // Mock language availability check
      mockPrisma.language.findUnique.mockResolvedValue({
        id: 'lang-123',
        name: 'German',
        campaigns: [], // Available for adoption
      } as any)

      // Mock no existing customer
      mockStripe.customers.list.mockResolvedValue({ data: [] } as any)

      // Mock customer creation
      const mockCustomer = { id: 'cus_test123' }
      mockStripe.customers.create.mockResolvedValue(mockCustomer as any)

      // Mock no existing partner
      mockPrisma.partner.findUnique.mockResolvedValue(null)

      // Mock partner creation
      const mockPartner = { id: 'partner-123', ...validPayload.partnerInfo }
      mockPrisma.partner.create.mockResolvedValue(mockPartner as any)

      // Mock price lookup
      const mockPrice = { id: 'price_test123' }
      mockStripe.prices.list.mockResolvedValue({ data: [mockPrice] } as any)

      // Mock subscription creation
      const mockSubscription = {
        id: 'sub_test123',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days from now
        latest_invoice: {
          payment_intent: {
            client_secret: 'pi_test123_secret_123',
          },
        },
      }
      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription as any)

      // Mock campaign creation
      const mockCampaign = { id: 'campaign-123' }
      mockPrisma.campaign.create.mockResolvedValue(mockCampaign as any)

      // Mock language update
      mockPrisma.language.update.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toMatchObject({
        subscriptionId: 'sub_test123',
        campaignId: 'campaign-123',
        clientSecret: 'pi_test123_secret_123',
        customerId: 'cus_test123',
      })

      // Verify database operations
      expect(mockPrisma.partner.create).toHaveBeenCalledWith({
        data: {
          ...validPayload.partnerInfo,
          stripeCustomerId: 'cus_test123',
        },
      })

      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: {
          type: 'ADOPT_LANGUAGE',
          partnerId: 'partner-123',
          languageId: 'lang-123',
          monthlyAmount: 15000,
          currency: 'GBP',
          stripeSubscriptionId: 'sub_test123',
          status: 'ACTIVE',
          nextBillingDate: expect.any(Date),
        },
        include: {
          partner: true,
          language: true,
        },
      })

      expect(mockPrisma.language.update).toHaveBeenCalledWith({
        where: { id: 'lang-123' },
        data: { adoptionStatus: 'ADOPTED' },
      })
    })

    it('should return error if language is already adopted', async () => {
      // Mock language already adopted
      mockPrisma.language.findUnique.mockResolvedValue({
        id: 'lang-123',
        name: 'German',
        campaigns: [{ id: 'existing-campaign', type: 'ADOPT_LANGUAGE', status: 'ACTIVE' }], // Already adopted
      } as any)

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Language already adopted')
    })

    it('should return error if language is not found', async () => {
      // Mock language not found
      mockPrisma.language.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('Language not found')
    })

    it('should validate request payload and return error for invalid data', async () => {
      const invalidPayload = {
        ...validPayload,
        partnerInfo: {
          ...validPayload.partnerInfo,
          email: 'invalid-email', // Invalid email format
        },
      }

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid request data')
      expect(responseData.details).toBeDefined()
    })

    it('should handle translation sponsorship campaign type', async () => {
      const translationPayload = {
        ...validPayload,
        campaignType: 'SPONSOR_TRANSLATION' as const,
      }

      // Mock no existing customer
      mockStripe.customers.list.mockResolvedValue({ data: [] } as any)

      // Mock customer creation
      const mockCustomer = { id: 'cus_test123' }
      mockStripe.customers.create.mockResolvedValue(mockCustomer as any)

      // Mock no existing partner
      mockPrisma.partner.findUnique.mockResolvedValue(null)

      // Mock partner creation
      const mockPartner = { id: 'partner-123', ...validPayload.partnerInfo }
      mockPrisma.partner.create.mockResolvedValue(mockPartner as any)

      // Mock price lookup
      const mockPrice = { id: 'price_test123' }
      mockStripe.prices.list.mockResolvedValue({ data: [mockPrice] } as any)

      // Mock subscription creation
      const mockSubscription = {
        id: 'sub_test123',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        latest_invoice: {
          payment_intent: {
            client_secret: 'pi_test123_secret_123',
          },
        },
      }
      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription as any)

      // Mock campaign creation
      const mockCampaign = { id: 'campaign-123' }
      mockPrisma.campaign.create.mockResolvedValue(mockCampaign as any)

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify(translationPayload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.subscriptionId).toBe('sub_test123')

      // Verify that language adoption status is NOT updated for translation sponsorship
      expect(mockPrisma.language.update).not.toHaveBeenCalled()

      // Verify campaign type is correct
      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'SPONSOR_TRANSLATION',
        }),
        include: {
          partner: true,
          language: true,
        },
      })
    })

    it('should use existing customer if email already exists', async () => {
      // Mock language availability
      mockPrisma.language.findUnique.mockResolvedValue({
        id: 'lang-123',
        name: 'German',
        campaigns: [],
      } as any)

      // Mock existing customer
      const existingCustomer = { id: 'cus_existing123' }
      mockStripe.customers.list.mockResolvedValue({ data: [existingCustomer] } as any)

      // Mock existing partner
      const existingPartner = { 
        id: 'partner-existing123', 
        ...validPayload.partnerInfo,
        stripeCustomerId: null,
      }
      mockPrisma.partner.findUnique.mockResolvedValue(existingPartner as any)

      // Mock partner update to add stripe customer ID
      mockPrisma.partner.update.mockResolvedValue({
        ...existingPartner,
        stripeCustomerId: 'cus_existing123',
      } as any)

      // Mock other required calls
      const mockPrice = { id: 'price_test123' }
      mockStripe.prices.list.mockResolvedValue({ data: [mockPrice] } as any)

      const mockSubscription = {
        id: 'sub_test123',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        latest_invoice: {
          payment_intent: {
            client_secret: 'pi_test123_secret_123',
          },
        },
      }
      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription as any)

      const mockCampaign = { id: 'campaign-123' }
      mockPrisma.campaign.create.mockResolvedValue(mockCampaign as any)
      mockPrisma.language.update.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.customerId).toBe('cus_existing123')

      // Verify that existing customer was used, not created
      expect(mockStripe.customers.create).not.toHaveBeenCalled()
      expect(mockPrisma.partner.create).not.toHaveBeenCalled()
      expect(mockPrisma.partner.update).toHaveBeenCalledWith({
        where: { id: 'partner-existing123' },
        data: { stripeCustomerId: 'cus_existing123' },
      })
    })
  })
})