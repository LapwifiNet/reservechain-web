// Response shapes as the backend and CMS ACTUALLY return them.
//
// The overlay shipped invented shapes — a passport with `lotId` /
// `coaReference` / `activated` / `tokenMapping.symbol`, an investor status of
// `{ registered, kycStatus }`, and a waitlist payload of `{ name, region }`.
// None of those fields exist. Every data screen would have rendered `undefined`
// or failed validation. These are transcribed from the live contracts.

/** A Payload collection list response. */
export type PayloadList<T> = { docs: T[]; totalDocs: number };

/** `asset-programs` as the CMS stores it (Payload REST, published only). */
export type AssetProgram = {
  id: string;
  slug: string;
  title: string;
  code: string;
  metal: string;
  purity?: string | null;
  summary?: string | null;
  stage?: string | null;
};

/**
 * `GET {CMS}/passports/public/:slug` — the sanitised Digital Asset Passport.
 * Program-level, not per-lot. `tokenMapping` is null unless an administrator
 * has explicitly activated it, which has not happened.
 */
export type Passport = {
  slug: string;
  title: string;
  stage: string;
  program: {
    title: string | null;
    code: string | null;
    metal: string | null;
    purity: string | null;
    stage: string | null;
  };
  highlights: { label: string; value: string }[];
  tokenMapping: {
    contractAddress: string | null;
    circulatingSupply: number | null;
  } | null;
  disclosure: string;
};

/**
 * `POST {API}/waitlist`. investorType is REQUIRED and constrained; consent must
 * be literally true — the API is the enforcement point, and `@Equals(true)`
 * rejects `false` rather than storing a registration with no recorded consent.
 * The API strips unknown fields, so a `region` would silently vanish and a
 * `name` would fail as a missing `fullName`.
 */
export type WaitlistInvestorType =
  | "institution"
  | "investor"
  | "partner"
  | "other";

export type WaitlistPayload = {
  fullName: string;
  email: string;
  investorType: WaitlistInvestorType;
  consent: true;
  organization?: string;
  interest?: string;
  locale?: string;
};

export type Investor = {
  id: string | null;
  email: string;
  fullName: string;
  memberSince?: string | null;
};

/** `GET {API}/investor/status` — a read-only aggregate. */
export type InvestorStatus = {
  profile: Investor;
  waitlist: {
    investorType: string;
    organization: string | null;
    interest: string | null;
    joinedAt: string;
  } | null;
  kyc: {
    /** not_started | pending | in_review | approved | rejected */
    status: string;
    riskLevel: string;
    /** Always a labelled stub today — never present it as a real screening. */
    sanctions: string;
  };
  programs: {
    code: string;
    name: string;
    metal: string;
    purity: string;
    status: string;
  }[];
};

export type AuthResponse = {
  accessToken: string;
  investor: Investor;
};
