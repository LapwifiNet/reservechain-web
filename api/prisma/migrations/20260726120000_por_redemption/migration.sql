-- P11/P12 gated modules: Proof-of-Reserves and Redemption.
--
-- Creates the two tables as published SHAPE only. Both modules are inactive:
-- their services refuse every call and import no PrismaModule, so nothing reads
-- or writes these tables, no seed touches them, and they stay empty until the
-- modules are genuinely implemented under written authorization.
--
-- Reviewed line by line before committing, as `migrate diff` skips the safety
-- checks `migrate dev` applies and has already produced one stray DROP TABLE in
-- this repository. This diff is purely additive: two CREATE TABLE statements and
-- three CREATE INDEX statements, with no DROP and no ALTER against any existing
-- table.

-- CreateTable
CREATE TABLE "ReserveAttestation" (
    "id" TEXT NOT NULL,
    "programCode" TEXT NOT NULL,
    "circulatingSupply" DOUBLE PRECISION NOT NULL,
    "verifiedReserve" DOUBLE PRECISION NOT NULL,
    "ratio" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "attestedBy" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReserveAttestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedemptionRequest" (
    "id" TEXT NOT NULL,
    "investorEmail" TEXT NOT NULL,
    "programCode" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvals" INTEGER NOT NULL DEFAULT 0,
    "requiredApprovals" INTEGER NOT NULL DEFAULT 2,
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "txRef" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedemptionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReserveAttestation_status_periodEnd_idx" ON "ReserveAttestation"("status", "periodEnd");

-- CreateIndex
CREATE INDEX "RedemptionRequest_investorEmail_createdAt_idx" ON "RedemptionRequest"("investorEmail", "createdAt");

-- CreateIndex
CREATE INDEX "RedemptionRequest_status_idx" ON "RedemptionRequest"("status");

