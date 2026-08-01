import type { components } from "./generated/api";

/**
 * API response types.
 *
 * Every type below is an alias into `./generated/api`, which is generated from
 * `api/openapi.json`, which is generated from the API's own response classes.
 * Nothing here is transcribed by hand any more.
 *
 * This file used to hold 15 hand-written definitions. Comparing them against
 * the generated schema found 27 discrepancies — four fields the API returns
 * that were never declared (`organization`, `interest`, `locale` on a waitlist
 * row; `sanctions` on a KYC case), one declared field the list endpoint never
 * returns (`AssetProgram.records`), one enum modelled as a bare `string`, and
 * 21 fields declared optional that are always present. None of them produced a
 * compile error, because nothing compared the two.
 *
 * The names are kept as they were so no call site changed. Where the API turned
 * out to serve two different shapes behind one name, the alias points at the
 * one that route actually returns and the other is named separately.
 */

type Schemas = components["schemas"];

/** `GET /assets/programs` — no `records` on this shape. */
export type AssetProgram = Schemas["AssetProgramSummary"];

/** `GET /assets/programs/:code` — the only shape that carries `records`. */
export type AssetProgramDetail = Schemas["AssetProgramDetail"];

/** `GET /assets/registry` — `program` is always included, never optional. */
export type AssetRecord = Schemas["AssetRecordWithProgram"];

export type Passport = Schemas["PassportResponse"];
export type WaitlistEntry = Schemas["WaitlistEntryResponse"];
export type Allocation = Schemas["TokenomicsAllocation"];
export type Tokenomics = Schemas["TokenomicsResponse"];
export type DashboardStats = Schemas["DashboardStats"];
export type AuditEvent = Schemas["AuditEventResponse"];
export type AuditListResponse = Schemas["AuditListResponse"];
export type ChainVerificationResult = Schemas["ChainVerificationResponse"];

/**
 * `GET /kyc/cases` omits `email`; `GET /kyc/cases/:id` includes it (invariant
 * 23). One hand-written `KycCase` stood for both, which is how a field that
 * exists on only one of them gets read on the other.
 */
export type KycCase = Schemas["KycCaseListItem"];
export type KycCaseDetail = Schemas["KycCaseDetail"];
export type KycStats = Schemas["KycStats"];

/** Unions now come from the API's `@IsIn` rules, not a second copy of them. */
export type KycSubjectType = KycCase["subjectType"];
export type KycCaseStatus = KycCase["status"];
export type KycRiskLevel = NonNullable<KycCase["riskLevel"]>;
