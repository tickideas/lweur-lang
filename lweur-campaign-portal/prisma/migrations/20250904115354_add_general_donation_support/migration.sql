-- AlterEnum
ALTER TYPE "public"."CampaignType" ADD VALUE 'GENERAL_DONATION';

-- AlterTable
ALTER TABLE "public"."checkout_settings" ADD COLUMN     "generalDonationDefaultAmount" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "generalDonationMaxAmount" INTEGER NOT NULL DEFAULT 500000,
ADD COLUMN     "generalDonationMinAmount" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "generalDonationPresetAmounts" INTEGER[] DEFAULT ARRAY[2500, 5000, 10000, 15000, 25000]::INTEGER[];
