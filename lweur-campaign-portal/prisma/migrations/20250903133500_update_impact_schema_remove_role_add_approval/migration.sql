-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('ADMIN', 'PUBLIC');

-- AlterTable
ALTER TABLE "impact_stories" 
ADD COLUMN "email" TEXT,
ADD COLUMN "submissionType" "SubmissionType" NOT NULL DEFAULT 'ADMIN',
ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedBy" TEXT;

-- Update existing records to be approved admin submissions
UPDATE "impact_stories" SET 
"isApproved" = true,
"submissionType" = 'ADMIN'
WHERE "submissionType" = 'ADMIN';

-- Now drop the authorRole column
ALTER TABLE "impact_stories" DROP COLUMN "authorRole";

-- CreateIndex
CREATE INDEX "impact_stories_submissionType_isApproved_idx" ON "impact_stories"("submissionType", "isApproved");