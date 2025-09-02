-- CreateEnum
CREATE TYPE "public"."AdoptionStatus" AS ENUM ('AVAILABLE', 'ADOPTED', 'PENDING', 'WAITLIST');

-- CreateEnum
CREATE TYPE "public"."CampaignType" AS ENUM ('ADOPT_LANGUAGE', 'SPONSOR_TRANSLATION');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."AdminRole" AS ENUM ('SUPER_ADMIN', 'CAMPAIGN_MANAGER', 'FINANCE', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."CommunicationType" AS ENUM ('EMAIL', 'PHONE', 'SMS', 'NEWSLETTER', 'WELCOME_SERIES', 'PAYMENT_REMINDER', 'IMPACT_REPORT');

-- CreateTable
CREATE TABLE "public"."partners" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "organization" TEXT,
    "country" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."languages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "iso639Code" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "countries" TEXT[],
    "speakerCount" INTEGER NOT NULL,
    "flagUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adoptionStatus" "public"."AdoptionStatus" NOT NULL DEFAULT 'AVAILABLE',
    "translationNeedsSponsorship" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaigns" (
    "id" TEXT NOT NULL,
    "type" "public"."CampaignType" NOT NULL,
    "partnerId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "monthlyAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeSubscriptionId" TEXT,
    "nextBillingDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "stripePaymentIntentId" TEXT,
    "stripeInvoiceId" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failureReason" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "public"."AdminRole" NOT NULL DEFAULT 'VIEWER',
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communications" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "adminId" TEXT,
    "type" "public"."CommunicationType" NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followUpDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'sent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."checkout_settings" (
    "id" TEXT NOT NULL,
    "availableCurrencies" TEXT[] DEFAULT ARRAY['GBP', 'EUR', 'USD']::TEXT[],
    "defaultCurrency" TEXT NOT NULL DEFAULT 'GBP',
    "adoptLanguageDefaultAmount" INTEGER NOT NULL DEFAULT 15000,
    "adoptLanguagePresetAmounts" INTEGER[] DEFAULT ARRAY[5000, 10000, 15000, 25000]::INTEGER[],
    "adoptLanguageMinAmount" INTEGER NOT NULL DEFAULT 1000,
    "adoptLanguageMaxAmount" INTEGER NOT NULL DEFAULT 100000,
    "sponsorTranslationDefaultAmount" INTEGER NOT NULL DEFAULT 15000,
    "sponsorTranslationPresetAmounts" INTEGER[] DEFAULT ARRAY[5000, 10000, 15000, 25000]::INTEGER[],
    "sponsorTranslationMinAmount" INTEGER NOT NULL DEFAULT 1000,
    "sponsorTranslationMaxAmount" INTEGER NOT NULL DEFAULT 100000,
    "enableGiftAid" BOOLEAN NOT NULL DEFAULT true,
    "giftAidDescription" TEXT NOT NULL DEFAULT 'I am a UK taxpayer and I understand that if I pay less Income and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in the relevant tax year, it is my responsibility to pay any difference.',
    "showOneTimeOption" BOOLEAN NOT NULL DEFAULT false,
    "requirePhone" BOOLEAN NOT NULL DEFAULT false,
    "requireOrganization" BOOLEAN NOT NULL DEFAULT false,
    "hearFromUsOptions" TEXT[] DEFAULT ARRAY['Search Engine', 'Social Media', 'Friend/Family', 'Church', 'Advertisement', 'Email', 'Other']::TEXT[],
    "checkoutTitle" TEXT NOT NULL DEFAULT 'Your generosity is transforming lives!',
    "checkoutSubtitle" TEXT NOT NULL DEFAULT 'Support Loveworld Europe''s mission to reach every European language with the Gospel',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partners_email_key" ON "public"."partners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "partners_stripeCustomerId_key" ON "public"."partners"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "public"."languages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_iso639Code_key" ON "public"."languages"("iso639Code");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_stripeSubscriptionId_key" ON "public"."campaigns"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "campaigns_partnerId_idx" ON "public"."campaigns"("partnerId");

-- CreateIndex
CREATE INDEX "campaigns_languageId_idx" ON "public"."campaigns"("languageId");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "public"."campaigns"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "public"."payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "payments_campaignId_idx" ON "public"."payments"("campaignId");

-- CreateIndex
CREATE INDEX "payments_partnerId_idx" ON "public"."payments"("partnerId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "public"."admins"("email");

-- CreateIndex
CREATE INDEX "communications_partnerId_idx" ON "public"."communications"("partnerId");

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "public"."languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communications" ADD CONSTRAINT "communications_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communications" ADD CONSTRAINT "communications_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
