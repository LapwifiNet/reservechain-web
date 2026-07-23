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
