-- P8 investor portal.
-- InvestorUser is deliberately separate from AdminUser: portal accounts never
-- feed the admin Role checks, and portal tokens are signed with their own
-- secret. KycCase gains an optional investor-email link (surfaced read-only in
-- the portal) and a persisted sanctions outcome (null = not screened).

-- AlterTable
ALTER TABLE "KycCase" ADD COLUMN     "email" TEXT,
ADD COLUMN     "sanctions" TEXT;

-- CreateTable
CREATE TABLE "InvestorUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestorUser_email_key" ON "InvestorUser"("email");

-- CreateIndex
CREATE INDEX "KycCase_email_idx" ON "KycCase"("email");
