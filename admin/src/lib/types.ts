export type AssetProgram = {
  id: string;
  code: string;
  name: string;
  metal: string;
  purity: string;
  description?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  records?: AssetRecord[];
};

export type AssetRecord = {
  id: string;
  assetId: string;
  programId: string;
  program?: AssetProgram;
  batch?: string | null;
  weightKg?: number | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Passport = {
  id: string;
  passportId: string;
  assetRecordId: string;
  assetRecord?: AssetRecord;
  template: string;
  purity?: string | null;
  status: string;
  issuedAt?: string | null;
  createdAt?: string;
};

export type WaitlistEntry = {
  id: string;
  fullName: string;
  email: string;
  investorType: string;
  consent: boolean;
  createdAt?: string;
};

export type Allocation = { bucket: string; pct: number };

export type Tokenomics = {
  symbol: string;
  capIllustrative: string;
  reserveRatio: string;
  transferFee: string;
  allocations: Allocation[];
  note: string;
};

export type DashboardStats = {
  totals: {
    waitlist: number;
    programs: number;
    records: number;
    passportsIssued: number;
  };
  registrationsByType: { type: string; count: number }[];
  recentActivity: {
    assetId: string;
    program: string;
    status: string;
    updatedAt: string;
  }[];
};

export type AuditEvent = {
  id: string;
  sequence: number;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  prevHash?: string | null;
  hash?: string | null;
  createdAt: string;
};

export type AuditListResponse = {
  events: AuditEvent[];
  total: number;
};

// Mirrors the KycCase model in api/prisma/schema.prisma. The columns are plain
// strings in the database; the unions below come from the class-validator
// @IsIn rules on CreateKycCaseDto and ReviewKycCaseDto.
export type KycSubjectType = "person" | "entity";
export type KycCaseStatus = "pending" | "in_review" | "approved" | "rejected";
export type KycRiskLevel = "low" | "medium" | "high" | "unrated";

export type KycCase = {
  id: string;
  subjectType: KycSubjectType;
  legalName: string;
  country: string;
  status: KycCaseStatus;
  riskLevel?: KycRiskLevel | null;
  notes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

// Shape returned by KycService.stats().
export type KycStats = {
  total: number;
  byStatus: { status: KycCaseStatus; count: number }[];
};

export type ChainVerificationResult = {
  valid: boolean;
  firstBrokenSequence?: number;
  totalEvents: number;
};
