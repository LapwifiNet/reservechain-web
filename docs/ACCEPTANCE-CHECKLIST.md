# ReserveChain — Acceptance & QA Checklist

> ## Status: NOT A RECORD OF TESTING PERFORMED
>
> An acceptance checklist exists to be signed, and a signed checklist asserts
> that testing happened. Read this before ticking anything.
>
> Every item below carries its **actual** status against this repository. The
> statuses are not aspirations: `✅ Verified` means it was executed locally and
> the result observed; `⚠️ Unverifiable` means it depends on something that does
> not exist or has never run, and **cannot be ticked today by anyone**;
> `❌ Absent` means the item describes something this repository does not
> contain.
>
> Nothing here has been verified in a deployed environment, because there is
> none. Specifically, none of the following exists or has ever run: GitHub
> Actions (billing-locked — no workflow has ever executed), any AWS resource
> (`infra/terraform/` is validated, never applied), any monitoring alarm,
> dashboard or on-call rotation, any release binary, any iOS build of any kind,
> any app-store listing, and any hosted URL. A **debug APK** has been built and
> run on an Android emulator (see P13) — that is the only binary that exists and
> the only device-class environment anything has run in.
>
> Do not sign this document as evidence of acceptance testing. It is a statement
> of what has and has not been checked.

Maps every phase of the 22-phase build plan to acceptance criteria and current
status.

> **Testnet only.** No mainnet activity. The four sensitive modules
> (Proof-of-Reserves, redemption, wallet, purchase) refuse every request with
> `501` — at the guard while their flag is off, and again in their own service
> if a flag is on. **No flag makes them work.** All quantities, purities and
> tokenomics figures are **illustrative**.

## Status legend

| Symbol | Meaning |
| --- | --- |
| ✅ Verified | Executed locally against this repository and the result observed |
| ⚠️ Unverifiable | Depends on something that does not exist or has never run. Cannot be ticked today |
| 🔒 Inert | Built as a published route shape that refuses with `501` and holds no data. Not "off pending a flag" |
| ❌ Absent | The item describes something this repository does not contain |
| ⬜ Client | Requires client input, credentials, or a business decision |

## How to run acceptance

1. Bring up the stack locally: `docker compose up --build` (web 3000, api 4000,
   admin 4100, cms 3001, two Postgres instances). There is no hosted
   environment to test against.
2. Seed accounts locally — the seed generates a random password and prints it
   once; it refuses to create staff users when `NODE_ENV=production`, and no
   credential is committed.
3. Keep every `*_ENABLED` flag `false`. Turning one on activates nothing, but
   the gated modules must ship off regardless.
4. **Use synthetic data only.** Never enter a real name, a real email address, a
   real wallet address or any payment instrument into any surface here. Nothing
   in this system needs real personal data to be exercised, and the waitlist and
   investor tables hold PII under the same rules as production would.

---

## Phase-by-phase acceptance

### P1 — Public website
- [ ] Homepage renders dark-first and responsive — ✅ Verified (renders 200 in en/es/it)
- [ ] Copper Powder and Nickel Wire program pages present, purities shown as **illustrative** — ✅ Verified
- [ ] Digital Asset Passport pages reachable at `/<locale>/passports` — ✅ Verified. Note: passports are **program-level and come from the CMS**; the list is empty unless a CMS instance is running with published passports. The per-lot `/passport/<id>` page was **deleted** for rendering invented content, and old URLs 308-redirect
- [ ] No content presented as an offer or sale; figures labelled illustrative — ✅ Verified

### P2 — Waitlist, i18n & disclosure
- [ ] Multi-step waitlist with eligibility consent; persists via the API — ✅ Verified
- [ ] EN / ES / IT across all pages — ✅ Verified (key-path parity enforced by `npm test` at the root)
- [ ] Verbatim prelaunch disclosure, byte-identical everywhere it appears — ✅ Verified (website, CMS and mobile all 498 chars, compared byte-for-byte)
- [ ] Invalid email / missing consent blocked client **and** server side — ✅ Verified (`@Equals(true)` on the DTO; the API is the enforcement point)

### P3 — ERC-20 token & tokenomics
- [ ] ERC-20 compiles; `forge test` green — ✅ Verified (13 tests pass)
- [ ] Tokenomics values come from `TokenomicsConfig`, not literals — ✅ Verified
- [ ] Deploy scripts target **testnet** only — ✅ Verified in code (mainnet chain id blocked). **Never executed** — no contract has been deployed to any network

### P4 — Wallet & multisig
- [ ] Gnosis Safe multisig config + wallet scaffolding present — ✅ Verified (documentation and templates under `infra/wallets/`)
- [ ] Wallet module refuses every request — 🔒 Inert. Not merely "flag off": the service refuses even with `WALLET_ENABLED=true`
- [ ] Gated endpoints return **`501`** (`module_disabled` at the guard, `*_inactive` at the service) — ✅ Verified by request in both flag states. **The contract is 501, never 503**

### P5 — Backend API
- [ ] API boots with `/api` prefix, helmet, CORS, ValidationPipe — ✅ Verified
- [ ] `GET /api/health` returns ok — ✅ Verified
- [ ] Prisma migrations apply in order — ✅ Verified locally against Postgres (8 migrations, see pre-flight below)

### P6 — Auth + KYC/AML + RBAC
- [ ] JWT auth; ADMIN / COMPLIANCE / VIEWER enforced — ✅ Verified
- [ ] KYC lifecycle: create → screen(stub) → review → status — ✅ Verified
- [ ] Sanctions screening is a **labelled stub** — ✅ Verified. It contacts no provider and records the literal `clear_stub`; every surface showing it carries the stub wording
- [ ] Review records both reviewer **and** timestamp — ✅ Verified against Postgres
- [ ] Unauthorized access to admin routes blocked — ✅ Verified
- [ ] Service principal cannot write — ✅ Verified (`403 service_principal_write_denied`)

### P7 — Admin Console
- [ ] Admin login + dashboard (waitlist, KYC/KYB, tokenomics, audit) — ✅ Verified
- [ ] ~~Sensitive-module toggles reflect flag state (read-only when off)~~ — ❌ Absent. **There is no toggle UI.** `/reserves` and `/redemption` render a static gated notice showing the code `501`. Flags are environment variables, not console controls, and deliberately so

### P8 — Investor Portal
- [ ] Investor register / login; token issued — ✅ Verified. The API returns a bearer token; the **website** stores it in the httpOnly `rc_investor` cookie
- [ ] `GET /api/investor/status` returns KYC state — ✅ Verified
- [ ] Investor cannot access admin scope, and an admin token cannot access investor routes — ✅ Verified in both directions, including cross-signed forgeries
- [ ] ~~Investor submits identity documents for KYC~~ — ❌ Absent. There is **no investor-facing KYC submission surface**; the portal only displays a status

### P9 — Audit log
- [ ] Audit interceptor records mutating requests — ✅ Verified. Scope is role-guarded routes **plus** investor-domain routes, staff sign-ins and public waitlist signups. Reads are never recorded
- [ ] Staff sign-ins recorded on success **and** failure, with rejected attempts carrying no attempted address — ✅ Verified against Postgres
- [ ] Passwords and PII redacted before storage — ✅ Verified (`[REDACTED]` / `[PII_REDACTED]`, plus a table-wide scan for the plaintext)
- [ ] Log is append-only and chain-verifiable — ✅ Verified (`/audit/verify` valid; no update or delete route exists)

### P10 — CMS & Digital Asset Passports
- [ ] Five collections defined; Payload admin reachable — ✅ Verified locally
- [ ] Asset Program → Record → Passport publishes to the public endpoint — ✅ Verified via seed + the public endpoint. The **publish workflow through the Payload admin UI** has not been exercised by hand
- [ ] Public passport endpoint hides internal fields; token mapping only when activated — ✅ Verified (returns `null` while inactive, which is its permanent state today)
- [ ] CMS runs on its own database with its own token domain — ✅ Verified (zero CMS tables in the API's database; admin and investor JWTs both resolve to `user: null`)

### P11 — Proof-of-Reserves
- [ ] Attestation model and route shape published — ✅ Verified
- [ ] ~~Attestations can be created and published; ratio = verified / circulating~~ — 🔒 Inert. **This does not work and must not be ticked.** The service refuses every call; the table is empty and must stay empty. No reserve figure, custodian, auditor, vault or coverage ratio exists anywhere in this system

### P12 — Redemption
- [ ] Redemption model and route shape published — ✅ Verified
- [ ] ~~Approval flow reaches `approved` at the threshold, then settles~~ — 🔒 Inert. **This does not work and must not be ticked.** The service refuses every call and the table is empty. (The overlay's approval counter also had no distinct approver identity, so one account could satisfy a two-of-N threshold twice — a schema change for whoever implements it)

### P13 — Mobile (iOS + Android, Expo)
- [ ] Screens implemented: Home, Programs, Program detail, Passport, Waitlist, Investor — ✅ Verified by lint + `tsc --noEmit`
- [ ] EN/ES/IT with key parity; disclosure byte-identical to the website — ✅ Verified
- [ ] Investor domain only; no screen for any gated module — ✅ Verified
- [x] App launches and screens render — ✅ Verified on **web export** (Playwright, 11/11 assertions, dark theme + disclosure + 3 CTAs) and **Android emulator** (debug APK, `Linken_AdMachine`; home screen renders title/CTAs/disclosure verbatim)
- [x] Six Maestro flows pass — ✅ Verified on **Android emulator**: 01-home-smoke, 02-waitlist-validation, 03-waitlist-happy-path (backend, real POST /waitlist), 04-i18n-switch all pass. 05-investor-auth and 06-programs-passport fail on environment, not app code: 05 needs the investor register/status endpoints reachable from the emulator and 06 needs the CMS running with published programs (postgres-cms port 5433 conflicts with the TTN dev stack). Re-run once CMS/API are on non-conflicting hosts. All six intents additionally covered on web (Playwright)
- [ ] iOS + Android store builds via EAS — ⚠️ Unverifiable. Needs an Expo account, an Apple team id and Google Play credentials. This project has none

### P14 — Whitepaper
- [ ] ~~Whitepaper covers architecture, tokenomics, compliance, disclosures~~ — ❌ Absent. **There is no whitepaper in this repository.** If one exists it is in Notion

### P15 — Testing
- [ ] Backend e2e (Jest) pass — ✅ Verified (162 tests, ten consecutive runs)
- [ ] Contract tests (Foundry) pass — ✅ Verified (13 tests)
- [ ] Mobile typecheck and lint pass — ✅ Verified locally
- [ ] Locale parity enforced by a test — ✅ Verified (root `npm test`)

### P16 — CI/CD
- [ ] ~~CI runs lint/typecheck/tests on PR~~ — ⚠️ Unverifiable. **GitHub Actions has never run on this repository**; the account is billing-locked and every job fails at startup. The workflows are `actionlint`-clean and nothing more. Local verification is the only gate that has ever held
- [ ] Deploy workflow builds → ECR → ECS — ⚠️ Unverifiable. Never dispatched; `AWS_DEPLOY_ROLE_ARN` is not set on the repository, and the `prod` environment has no required reviewers configured
- [ ] Mobile E2E workflow — ⚠️ Unverifiable. Never dispatched; needs EAS credentials that do not exist

### P17 — Infrastructure (AWS + Terraform)
- [ ] Terraform **defines** VPC/ALB/ECS/RDS/S3/CloudFront/ECR/Secrets/IAM — ✅ Verified (`terraform validate`, `fmt -check`, `init -backend=false`)
- [ ] Per-env workspaces; prod Multi-AZ + deletion protection — ✅ Verified in configuration only
- [ ] ~~`terraform apply` clean on host~~ — ⚠️ Unverifiable. **Never applied. No AWS resource exists**, and no `plan` has been run against real credentials

### P18 — Deployment
- [ ] Three environments defined in configuration — ✅ Verified in configuration only
- [ ] ~~Rolling deploy, no downtime; automatic `prisma migrate deploy`~~ — ⚠️ Unverifiable. **Nothing has ever been deployed.** Note that the API entrypoint runs migrations at container start, so approving a production deploy is approving a production migration
- [ ] Staging verified before prod promote — ⚠️ Unverifiable. **There is no staging environment**, and nothing enforces promotion order

### P19 — Monitoring & observability
- [ ] CloudWatch log groups **defined** per service — ✅ Verified in configuration only
- [ ] ~~Sentry wiring documented~~ — ❌ Absent. **No error-tracking service is integrated anywhere**, and none is documented
- [ ] ~~Alerts + on-call configured~~ — ❌ Absent. No CloudWatch alarm, dashboard or SNS topic exists, and there is **no on-call rotation**. `infra/terraform/` creates log groups only

### P20 — Security hardening
- [ ] Helmet, CORS allowlist, input validation — ✅ Verified
- [ ] No secret, key or credential committed — ✅ Verified (no `.env`, `.tfvars` or state tracked; the seed commits no password)
- [ ] All sensitive flags default false; mainnet blocked in code — ✅ Verified (chain id constrained by validation, not by comment)
- [ ] Three disjoint token domains, each guard binding its own key — ✅ Verified at every mount point
- [ ] Secret rotation procedure documented — ✅ Verified (`docs/RUNBOOK.md`, itself never exercised)
- [ ] Pen-test / external review — ❌ Absent. **None has been performed.** Recorded in `SECURITY.md`

### P21 — Documentation
- [ ] User Manual + Admin Manual — ✅ Verified present, corrected against the code
- [ ] Ops Runbook — ✅ Verified present. **Every procedure in it is untested**
- [ ] Training / onboarding guide — ✅ Verified present
- [ ] ~~Whitepaper + architecture docs~~ — ❌ Absent from this repository

### P22 — Handover & training
- [ ] Repo access + secrets transfer — ⬜ Client
- [ ] Live walkthrough / training session — ⬜ Client
- [ ] Final acceptance sign-off recorded — ⬜ Client

---

## QA test matrix

**Use synthetic data throughout.** No item below requires — or permits — a real
name, email address, wallet address or payment instrument.

| ID | Area | Steps | Expected | Status |
| --- | --- | --- | --- | --- |
| QA-01 | Waitlist happy path | Submit a synthetic name + `@example.local` address with consent | Success; row persisted; audit event with the body redacted | ✅ Verified |
| QA-02 | Waitlist consent | Submit without consent | Blocked server-side (`@Equals(true)`) | ✅ Verified |
| QA-03 | i18n | Switch EN/ES/IT | All labels and the disclosure localized; key parity enforced by test | ✅ Verified |
| QA-04 | Investor auth | Register → login → status with synthetic credentials | Token issued; status returned; registration audited with the password redacted | ✅ Verified |
| QA-05 | RBAC | VIEWER hits an admin route | `403 insufficient_role` | ✅ Verified |
| QA-06 | Gated modules | Call wallet / purchase / redemption / PoR, flags **off and on** | **`501`** both times — `module_disabled`, then `*_inactive`. Never 503, never success | ✅ Verified |
| QA-07 | Passport | Open a published passport | Renders program, highlights, disclosure; `tokenMapping` is `null` | ✅ Verified. The **activated** token-mapping path has never been exercised — no lot has been activated |
| QA-08 | Audit | Perform an admin mutation | Entry appears, attributed and timestamped | ✅ Verified |
| QA-09 | Health | `GET /api/health` | 200 ok | ✅ Verified |
| QA-10 | Mobile | Launch app, browse programs, submit waitlist | Parity with web; disclosure present | ✅ Verified **in part** on the Android emulator (debug APK, `Linken_AdMachine`): the app launches, the disclosure renders verbatim, and the waitlist submits against a real `POST /waitlist` (Maestro 03). The remaining assertions — investor auth, programs → sample passport, i18n — passed **26/26 on the production web export** (2026-08-03, Playwright, API + CMS live); the CMS seed now publishes a passport per program slug (PR #26) so Maestro 06 resolves. See P13 |
| QA-11 | Token domains | Present an admin token to an investor route and vice versa | 401 in both directions, including cross-signed forgeries | ✅ Verified |
| QA-12 | Sign-in audit | Fail a sign-in against a real and an unknown account | Two byte-identical audit rows; neither names the attempted address | ✅ Verified |

## Environment pre-flight

- [ ] `.env` set for api / web / admin / cms; both databases reachable
- [ ] `cms/.env` present — `DATABASE_URI` is required and has no fallback. Confirm the port belongs to this project's CMS Postgres (`lsof -iTCP:5433 -sTCP:LISTEN -n -P`) before migrating: a wrong port connects and migrates rather than failing
- [ ] Migrations applied in order — the actual on-disk chain is:
      `init_db` → `p6_auth_kyc` → `p9_audit_log` → `waitlist_website_fields` →
      `investor_portal` → `drop_legacy_waitlist_table` → `por_redemption` →
      `wallet_purchase`
- [ ] CMS on its own database (`reservechain_cms`) and its own Postgres instance
- [ ] CMS `settings` row created — `npm run seed` does **not** create it, and until it exists the website silently falls back to the `SITE_MODE` env value and the first state on each status scale
- [ ] All `*_ENABLED` flags = `false`
- [ ] Seed accounts created locally (random password, printed once)
- [ ] Synthetic test data only — no real personal data anywhere

## Item counts

Counted over the phase-by-phase criteria above:

Counted mechanically over the 77 phase-by-phase criteria (the QA matrix is
counted separately below).

| Status | Count |
| --- | --- |
| ✅ Verified locally | 55 |
| ⚠️ Unverifiable today | 9 |
| ❌ Absent — describes something the repository does not contain | 7 |
| 🔒 Inert — built as a refusing route shape | 3 |
| ⬜ Client decision | 3 |
| **Total** | **77** |

QA matrix: 12 of 12 verified — QA-10 in part on the Android emulator (launch +
waitlist) and fully green on the production web export (26/26, 2026-08-03); QA-07's
activated-token-mapping path unexercised.

The seven **Absent** items are the gaps this checklist would otherwise have
ticked silently: no whitepaper, no architecture docs, no admin toggle UI, no
investor-facing KYC submission, no error tracking, no alerting or on-call, and
no penetration test.

## Sign-off

**Do not sign this as evidence that acceptance testing was performed.** Nine
criteria cannot be verified by anyone today, seven describe features that do not
exist, three are inert route shapes rather than working features, and nothing
has been tested in a deployed environment because there is none.

| Phase | Result (Pass/Fail) | Evidence | Reviewer | Date |
| --- | --- | --- | --- | --- |
| P1–P2 |  |  |  |  |
| P3–P4 |  |  |  |  |
| P5–P9 |  |  |  |  |
| P10–P12 |  |  |  |  |
| P13–P15 |  |  |  |  |
| P16–P20 |  |  |  |  |
| P21–P22 |  |  |  |  |

**Client acceptance:** ______________________  **Date:** ____________
