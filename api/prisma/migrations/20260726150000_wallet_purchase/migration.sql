-- Wallet and Purchase: gated modules, published shape only.
--
-- Creates both tables empty and leaves them empty. Neither service reads or
-- writes them, neither module imports PrismaModule, and no seed references
-- them. A Wallet row ties a durable public blockchain identifier to a named
-- investor; a PurchaseIntent is a record of an order for a token that is not
-- issued. Neither may be populated before the modules are implemented under
-- written authorization.
--
-- chainId defaults to 11155111 (Sepolia). Testnet only — AGENTS §1.
--
-- Reviewed line by line before committing, as `migrate diff` skips the safety
-- checks `migrate dev` applies and has already produced one stray DROP TABLE in
-- this repository. This diff is purely additive: two CREATE TABLE statements and
-- three CREATE INDEX statements, with no DROP and no ALTER against any existing
-- table.

-- CreateTable
CREATE TABLE "Wallet" (
    "investorEmail" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "status" TEXT NOT NULL DEFAULT 'linked',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("investorEmail")
);

-- CreateTable
CREATE TABLE "PurchaseIntent" (
    "id" TEXT NOT NULL,
    "investorEmail" TEXT NOT NULL,
    "programCode" TEXT NOT NULL,
    "tokenAmount" DOUBLE PRECISION NOT NULL,
    "quoteCurrency" TEXT,
    "walletAddress" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'testnet',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "txRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Wallet_address_idx" ON "Wallet"("address");

-- CreateIndex
CREATE INDEX "PurchaseIntent_investorEmail_createdAt_idx" ON "PurchaseIntent"("investorEmail", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseIntent_status_idx" ON "PurchaseIntent"("status");

