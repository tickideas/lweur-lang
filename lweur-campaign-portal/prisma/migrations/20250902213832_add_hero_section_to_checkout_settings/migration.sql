/*
  Warnings:

  - You are about to drop the column `enableGiftAid` on the `checkout_settings` table. All the data in the column will be lost.
  - You are about to drop the column `giftAidDescription` on the `checkout_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."checkout_settings" DROP COLUMN "enableGiftAid",
DROP COLUMN "giftAidDescription",
ADD COLUMN     "heroBackgroundColor" TEXT NOT NULL DEFAULT 'from-[#1226AA] to-blue-800',
ADD COLUMN     "heroEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "heroSubtitle" TEXT NOT NULL DEFAULT 'Your generosity is transforming lives across Europe',
ADD COLUMN     "heroTextColor" TEXT NOT NULL DEFAULT 'text-white',
ADD COLUMN     "heroTitle" TEXT NOT NULL DEFAULT 'YOU''RE A
WORLD
CHANGER';
