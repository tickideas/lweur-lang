// Database model types based on Prisma schema

export type AdoptionStatus = 'AVAILABLE' | 'ADOPTED' | 'PENDING' | 'WAITLIST';
export type CampaignType = 'ADOPT_LANGUAGE' | 'SPONSOR_TRANSLATION' | 'GENERAL_DONATION';
export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
export type AdminRole = 'SUPER_ADMIN' | 'CAMPAIGN_MANAGER' | 'FINANCE' | 'VIEWER';
export type CommunicationType = 'EMAIL' | 'PHONE' | 'SMS' | 'NEWSLETTER' | 'WELCOME_SERIES' | 'PAYMENT_REMINDER' | 'IMPACT_REPORT';

// Core data models
export interface Partner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  organization?: string;
  country: string;
  preferredLanguage: string;
  createdAt: Date;
  updatedAt: Date;
  stripeCustomerId?: string;
  isActive: boolean;
  campaigns?: Campaign[];
  payments?: Payment[];
  communications?: Communication[];
}

export interface Language {
  id: string;
  name: string;
  nativeName: string;
  iso639Code: string;
  region: string;
  countries: string[];
  speakerCount: number;
  flagUrl: string;
  isActive: boolean;
  adoptionStatus: AdoptionStatus;
  translationNeedsSponsorship: boolean;
  priority: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  campaigns?: Campaign[];
}

export interface Campaign {
  id: string;
  type: CampaignType;
  partnerId: string;
  languageId: string;
  monthlyAmount: number; // Amount in pence (£150 = 15000)
  currency: string;
  startDate: Date;
  endDate?: Date;
  status: CampaignStatus;
  stripeSubscriptionId?: string;
  nextBillingDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  partner?: Partner;
  language?: Language;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  campaignId: string;
  partnerId: string;
  amount: number; // Amount in pence
  currency: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  status: PaymentStatus;
  paymentDate: Date;
  failureReason?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  campaign?: Campaign;
  partner?: Partner;
}

export interface Admin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  passwordHash: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  communications?: Communication[];
}

export interface Communication {
  id: string;
  partnerId: string;
  adminId?: string;
  type: CommunicationType;
  subject: string;
  content: string;
  sentAt: Date;
  followUpDate?: Date;
  status: string;
  createdAt: Date;
  partner?: Partner;
  admin?: Admin;
}

// Form and API types
export interface PartnerRegistrationForm {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  organization?: string;
  country: string;
  preferredLanguage?: string;
}

export interface CampaignCreationForm {
  type: CampaignType;
  languageId: string;
  partnerInfo: PartnerRegistrationForm;
  paymentMethodId: string;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

export interface CheckoutSession {
  campaignType: CampaignType | null;
  selectedLanguages: Language[];
  partnerInfo: Partial<PartnerRegistrationForm>;
  paymentIntent?: string;
  step: 'SELECTION' | 'DETAILS' | 'PAYMENT' | 'CONFIRMATION';
}

// Analytics and reporting types
export interface DashboardMetrics {
  totalRevenue: number;
  activeSubscriptions: number;
  languageAdoptions: number;
  translationSponsors: number;
  revenueGrowth: number;
  partnerGrowth: number;
  conversionRate: number;
}

export interface RevenueAnalytics {
  period: string;
  amount: number;
  subscriptions: number;
  newPartners: number;
}

export interface LanguageMetrics {
  languageId: string;
  languageName: string;
  adoptionCount: number;
  sponsorshipCount: number;
  totalRevenue: number;
  speakerCount: number;
}

export interface PartnerMetrics {
  totalPartners: number;
  activePartners: number;
  newThisMonth: number;
  retentionRate: number;
  averageMonthlyValue: number;
  topCountries: Array<{
    country: string;
    count: number;
  }>;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Stripe-related types
export interface StripeSubscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  customer: string;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        currency: string;
      };
    }>;
  };
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

// Filter and search types
export interface LanguageFilters {
  region?: string;
  status?: AdoptionStatus;
  search?: string;
  priority?: number;
}

export interface PartnerFilters {
  country?: string;
  status?: 'active' | 'inactive';
  campaignType?: CampaignType;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CampaignFilters {
  status?: CampaignStatus;
  type?: CampaignType;
  partnerId?: string;
  languageId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Utility types
export type CreatePartnerInput = Omit<Partner, 'id' | 'createdAt' | 'updatedAt' | 'campaigns' | 'payments' | 'communications'>;
export type UpdatePartnerInput = Partial<CreatePartnerInput>;
export type CreateCampaignInput = Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'partner' | 'language' | 'payments'>;
export type UpdateCampaignInput = Partial<CreateCampaignInput>;