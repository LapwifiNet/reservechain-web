import type { components } from "./generated";

/**
 * Response shapes.
 *
 * The API-backed types are aliases into `./generated`, which is generated from
 * `api/openapi.json`. Nothing pointed at the API is transcribed by hand any
 * more — this file previously held five such types, and an earlier overlay
 * shipped four shapes that did not exist at all (`lotId`, `coaReference`,
 * `activated`, `tokenMapping.symbol`, an investor status of
 * `{ registered, kycStatus }`, a waitlist payload of `{ name, region }`). Every
 * one of those would have rendered `undefined` on a screen, and none of them
 * would have failed to compile.
 *
 * `generated.ts` is a single file with no imports and no runtime, so it costs
 * `mobile/` nothing: no package.json entry, no install-graph edge, no place in
 * the root tsconfig (invariant 54). The generator is a devDependency of `api/`
 * and writes the file here; `mobile` only reads it.
 *
 * The CMS types below are still hand-written, and say why.
 */

type Schemas = components["schemas"];

// ---------------------------------------------------------------------------
// API (generated)
// ---------------------------------------------------------------------------

/** `POST {API}/investor/register` and `/investor/login`. */
export type AuthResponse = Schemas["InvestorAuthResult"];

/** The investor as any API route exposes them — never with `passwordHash`. */
export type Investor = Schemas["InvestorPublic"];

/** `GET {API}/investor/status`. */
export type InvestorStatus = Schemas["InvestorStatus"];

/**
 * `POST {API}/waitlist`. This is the REQUEST body, taken from the API's own
 * DTO, so the four accepted `investorType` values and the `consent` constraint
 * come from `@IsIn` and `@Equals(true)` rather than from a comment.
 */
export type WaitlistPayload = Schemas["CreateWaitlistDto"];
export type WaitlistInvestorType = WaitlistPayload["investorType"];

// ---------------------------------------------------------------------------
// CMS (hand-written — out of the generator's reach)
// ---------------------------------------------------------------------------

/**
 * These three describe Payload, not the NestJS API, so `api/openapi.json`
 * cannot express them: Payload is a separate service, on its own database, in
 * its own token domain (invariants 24, 25), and it publishes no OpenAPI
 * document. It does emit its own `payload-types.ts` from its collection
 * configs, but that describes the *stored* document, not the sanitised shape
 * `/passports/public/:slug` returns — that projection is written by hand in the
 * CMS endpoint, so hand-written is what it stays until the CMS declares a
 * response type of its own. This is the drift surface that remains; it is
 * listed in docs/API-TYPES.md.
 */

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
