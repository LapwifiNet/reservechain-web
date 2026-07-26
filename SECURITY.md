# Security

## Status

This repository is a **contest submission**. It has not been selected yet, there is no client
engagement behind it, and nothing here runs in production.

- **Not audited.** No independent smart-contract audit has been performed on the
  `contracts/` suite.
- **Not penetration-tested.** No application or infrastructure penetration test has been
  performed on the website, the API, the admin console or the CMS.
- **Testnet only.** The contract suite targets the Sepolia testnet. There is no mainnet
  deployment and no mainnet contract address exists.
- **Do not use this with real funds or real assets.** Do not deploy it to mainnet, and do
  not use it to custody, transfer or account for anything of value.

The wallet, purchase, proof-of-reserves and redemption modules are built as published
route shapes only and refuse every call with HTTP `501` — both at `FeatureFlagGuard` when
their flag is off, and again in the service when it is on. Activating any of them requires
a finalized legal structure, an independent contract audit, a penetration test, and
written authorization.

## Known issues

| Issue | Location | Impact | Status |
| --- | --- | --- | --- |
| `KycService.review()` wrote `reviewedBy` but never `reviewedAt` | [api/src/kyc/kyc.service.ts](api/src/kyc/kyc.service.ts) | A reviewed KYC case was attributable to a reviewer but not to a time, so the admin console read a field that was permanently `null`. A compliance decision that cannot be placed in time cannot be checked against a sanctions list version or a document expiry. | **Fixed** — both are now written together, pinned by spec and verified against Postgres |
| `KycService.screen()` reports a `screenedAt` it never persists, and records no actor | [api/src/kyc/kyc.service.ts:66-82](api/src/kyc/kyc.service.ts#L66-L82) | The response advertises a screening timestamp that is never stored on the case, and the screening is unattributable — `screen()` takes no reviewer argument. Same defect family as the row above, on the same PII record. | Open |
| Investor `register` and `login` are mutating but not role-guarded, so they are never audited | [api/src/investor/investor.controller.ts:17-27](api/src/investor/investor.controller.ts#L17-L27), [api/src/audit/audit.interceptor.ts:40-45](api/src/audit/audit.interceptor.ts#L40-L45) | `AuditInterceptor` records only mutating requests on role-guarded routes. Investor self-registration creates an `InvestorUser` row holding email and full name with no audit event. Unlike the gated-module variants of this gap, this one is live today. | Open |
| `/kyc/[id]` per-case permalinks were dropped with no replacement | Removed in `823bb90`; console is now [admin/src/app/kyc/page.tsx](admin/src/app/kyc/page.tsx) + [KycConsole.tsx](admin/src/components/kyc/KycConsole.tsx) | There is no deep-linkable or shareable per-case URL; case selection is client-side state only. A compliance officer cannot send a colleague a link to one case. | Open |
| `reviewedBy` without `reviewedAt` is pre-baked into the gated models | [api/prisma/schema.prisma:188](api/prisma/schema.prisma#L188) (`RedemptionRequest`), [:230](api/prisma/schema.prisma#L230) (`PurchaseIntent`) | The same missing-timestamp defect as the KYC row, inherited by whoever implements redemption and purchase. No live impact: both tables must stay empty while the modules are inert. | Open (gated) |
| `Wallet.verified` is a boolean with no `verifiedAt` | [api/prisma/schema.prisma:213](api/prisma/schema.prisma#L213) | No record of when a wallet was verified, only that it was. No live impact: the table must stay empty while the module is inert. | Open (gated) |
| The redemption approval counter carries no distinct approver identity | [api/src/redemption/redemption.service.ts](api/src/redemption/redemption.service.ts) | As shipped in the overlay, `approvals` incremented once per call with no record of who approved, so a single account could satisfy a two-of-N threshold by calling twice. A correct implementation needs distinct approver identities, which is a schema change rather than a patch. No live impact while the module refuses every call. | Open (gated) |
| Admin endpoints in earlier scaffold revisions were unauthenticated | `a3536be` — all seven controllers, including `waitlist` (PII) and `dashboard` | Any environment built from a revision before `94b5872` serves waitlist PII and admin reads with no credential at all. **Verify the deployed revision before exposing any environment publicly.** | Auth added in `94b5872`, hardened in `75166ce`; guarded in the current tree |
| Audit-chain e2e flakiness caused by audit writes firing from an un-awaited rxjs `tap` | [api/src/audit/audit.interceptor.ts:74-89](api/src/audit/audit.interceptor.ts#L74-L89) | An audit write could land after a reader had already read the log, so the chain's integrity depended on timing. | **Fixed** in `60fd0c0` — see the note below |

### Note on the audit-chain flakiness

This is recorded as fixed rather than open, and the original diagnosis was incomplete. The
un-awaited `tap` was one of **three** causes, and removing it was not sufficient on its own
— 3 of 10 consecutive full-suite runs passed with only that fix in place. All three were
addressed in `60fd0c0`:

1. `AuditInterceptor` recorded from an un-awaited async callback inside an rxjs `tap`. The
   write is now part of the response stream (`concatMap` over `from(...)`), so the response
   completes only after the audit row is committed.
2. `AuditService.record()` was read-the-tail-then-insert with no serialization, so two
   concurrent writers could read the same tail, both chain onto it, and permanently fork
   the chain. The read and insert now run in a transaction holding
   `pg_advisory_xact_lock`.
3. The e2e suites share one database and verify the chain across the whole table, so
   parallel jest workers corrupted each other's view by construction. Jest now runs the
   suites serially (`maxWorkers: 1`).

## Before exposing any environment publicly

Nothing here is deployed. If that ever changes, confirm all of the following first. Each
line points at a known-issues row above rather than restating it.

1. **Verify the deployed revision is at or after `94b5872`.** Admin endpoints in earlier
   scaffold revisions were unauthenticated and served waitlist PII with no credential — see
   the "Admin endpoints in earlier scaffold revisions were unauthenticated" row above.
2. **Confirm all four feature flags are `false`** — `PROOF_OF_RESERVES_ENABLED`,
   `REDEMPTION_ENABLED`, `WALLET_ENABLED`, `PURCHASE_ENABLED`. See the gated-module
   paragraph under **Status**.
3. **Confirm no seeded admin user exists outside local development.** Admin seeding is
   skipped when `NODE_ENV=production`; verify it was not run against the target database by
   another path.

## Reporting

**Security contact: t@lapwifi.net**

Report anything exploitable **privately to that address**. Do not open a public issue for
it. Non-sensitive findings about the code itself — the kind of gaps recorded in the
known-issues table above — may still be raised as issues on the repository.

The disclosure process:

- **Acknowledgement target: 5 business days.** This is a target for confirming receipt, not
  a fix deadline.
- **No bounty is offered.** There is no payment for reports.
- **Reporters are credited** in any resulting fix or advisory, unless they ask not to be.

Because this is a not-yet-selected contest submission with nothing deployed, there is no
production system to report against. If this repository is ever engaged and operated, this
policy must be revisited before any environment is exposed publicly — see the preconditions
above.
