-- CreateTable
CREATE TABLE "ReconcileRun" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "summary" JSONB,
    "createdBy" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReconcileRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconcileException" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "message" TEXT NOT NULL,
    "data" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ReconcileException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReconcileRun_type_startedAt_idx" ON "ReconcileRun"("type", "startedAt");

-- CreateIndex
CREATE INDEX "ReconcileException_resolved_code_idx" ON "ReconcileException"("resolved", "code");

-- CreateIndex
CREATE INDEX "ReconcileException_runId_idx" ON "ReconcileException"("runId");

-- AddForeignKey
ALTER TABLE "ReconcileException" ADD CONSTRAINT "ReconcileException_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReconcileRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
