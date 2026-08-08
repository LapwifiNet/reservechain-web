# OpenRWA — Team Training & Onboarding Guide

Audience: anyone joining the team that builds or operates OpenRWA — developers, DevOps/ops, admin/compliance staff, and content editors. Read the role track that applies to you after the shared sections (§1–§3).

> **Status.** This repository is an unselected contest submission. Nothing is
> deployed, no AWS resource exists, and GitHub Actions has never run on it —
> the account is billing-locked and every job fails at startup. Sections below
> describing CI, deploys, staging, on-call or monitoring describe an intended
> process that has never been performed. Do not plan your first week around
> them; see the corrections inline.

> **Testnet only.** Mainnet requires written authorization (P20). Treat every
> figure as **illustrative**.
>
> The four sensitive modules (Proof-of-Reserves, Redemption, Wallet, Purchase)
> are not merely "disabled": each refuses every request with `501` at its guard
> when its flag is off, and again in its own service if the flag is on. No flag
> makes them work.

---

## 1. What OpenRWA is

A prelaunch platform demonstrating industrial-metals-backed RWA tokenization: a public website + waitlist, an investor portal, an admin console, a CMS-managed asset registry with Digital Asset Passports, an ERC-20 token suite, and four sensitive modules that ship inactive. Everything is prelaunch and testnet.

## 2. First-day onboarding checklist

- [ ] Access to the GitHub repo (`openrwa`) and read the README.
- [ ] Access to the Notion **Build Plan** and its child deliverable pages.
- [ ] Accounts for your role (see your track): admin console and CMS, both run
      locally. **There is no AWS account, no error-tracking account and no
      hosted environment to be given access to.**
- [ ] Team password manager access, if one exists. There are **no seed
      credentials** to hand over: the database seed commits no password and
      refuses to create staff users in production.
- [ ] Read the **Ops Runbook** and the **User + Admin Manual**.
- [ ] Local toolchain installed (§4) if you're a developer.
- [ ] Confirm you understand the testnet-only / illustrative rules.

## 3. Architecture at a glance

```
Browser / Mobile
   |
CloudFront ---- S3 (media)
   |
  ALB (host-based routing)
   |-- web    (Next.js 14, EN/ES/IT)
   |-- api    (NestJS + Prisma)  --- RDS Postgres
   |-- admin  (admin console)
   |-- cms    (Payload CMS)      --- CMS Postgres
   +-- contracts (Solidity/Foundry, testnet)
```

The diagram above is the **intended** topology, defined in `infra/terraform/`.
It has never been applied: there is no CloudFront distribution, ALB, ECS
cluster, RDS instance or S3 bucket. Locally, the four services run under Docker
Compose and talk to two Postgres containers.

CI/CD is GitHub Actions in the same sense — the workflows exist, are
syntactically valid (`actionlint`), and have never executed.

---

## 4. Developer track

### 4.1 Toolchain
- Node.js 20 LTS + npm, Git, Docker.
- PostgreSQL 16 locally (or Docker) — two databases: `openrwa` (app) and `openrwa_cms` (CMS).
- Foundry (`forge`, `cast`) for contracts.

### 4.2 Repo layout
| Path | What |
| --- | --- |
| `src/` | web app (Next.js 14 App Router, next-intl EN/ES/IT) |
| `api/` | backend (NestJS, Prisma, JWT auth, KYC, audit, investor, gated modules) |
| `admin/` | admin console |
| `cms/` | Payload CMS (asset programs/records/passports) |
| `contracts/` | ERC-20 + Foundry tests |
| `infra/terraform/` | AWS IaC |
| `.github/workflows/` | CI + deploy |
| `docs/` | manuals, runbook, this guide |

### 4.3 Local setup
```bash
git clone https://github.com/LapwifiNet/openrwa && cd openrwa
cp .env.example .env            # fill DATABASE_URL, JWT_SECRET, etc.

# API
cd api && npm install && npx prisma migrate dev && npm run start:dev   # :4000
# Web (new shell)
cd .. && npm install && npm run dev                                    # :3000
# CMS (new shell)
cd cms && npm install && npm run dev                                   # :3001
# Admin (new shell)
cd admin && npm install && npm run dev                                 # :4100
```
Key env: `DATABASE_URL`, `JWT_SECRET`, `SERVICE_API_TOKEN`, `WAITLIST_API_BASE`, `CMS_API_BASE`; all sensitive flags default `false`.

### 4.4 Databases & migrations
- Prisma is the source of truth for the app schema. Create a migration with `npx prisma migrate dev --name <change>`; deploy in prod with `prisma migrate deploy` (runs automatically in the API container).
- Follow **expand → migrate → contract** so code and schema stay one step compatible (safe rollback).
- Migration order for a fresh DB, as it actually is on disk:
  `init_db` → `p6_auth_kyc` → `p9_audit_log` → `waitlist_website_fields` →
  `investor_portal` → `drop_legacy_waitlist_table` → `por_redemption` →
  `wallet_purchase`. (Earlier documentation called the audit migration
  `audit_log` and placed it after `waitlist_website_fields`; both were wrong.)
- `prisma migrate dev` cannot run non-interactively, so migrations here are
  generated with `prisma migrate diff` and **read line by line before
  committing** — that path skips the safety checks and has already produced one
  stray `DROP TABLE` in this repository.

### 4.5 Testing
- API: `npm run test:e2e`. **A running Postgres is required** — most suites use
  the real database; only the three mock-persistence suites do not. If the
  database is unreachable the suite fails wholesale, which looks like a code
  regression and is not one.
- Web: `npm test` at the repository root runs the locale-parity check.
- Contracts: `forge build --sizes` and `forge test -vvv`.
- CI *is configured* to run web/api/admin/cms/contracts on push and PR to
  `main`, but has never run. Local verification is the only gate that has ever
  actually held: `npm ci`, lint, test, `tsc --noEmit` and build per package,
  plus the API e2e suite.

### 4.6 Contribution workflow
1. Branch from `main`.
2. Make the change + tests; keep secrets out of code.
3. Open a PR. **CI cannot be green** — it cannot run. Run the local matrix
   instead and paste the output.
4. Merge. The **Deploy** workflow exists but has never been dispatched, and
   `AWS_DEPLOY_ROLE_ARN` is not set, so it would fail at credential
   configuration. There is no staging environment to deploy to.
5. Read `APPLY-ORDER.md` before applying any overlay package: it holds the
   invariants that must survive every change, several of which exist because an
   overlay silently reverted them.

### 4.7 Conventions
- Auth: `JwtAuthGuard` + `RolesGuard` with `Role { ADMIN, COMPLIANCE, VIEWER }`;
  investor endpoints use `InvestorJwtGuard`. Tokens carry an explicit
  `typ` claim (`admin` / `investor`), **not** a `scope` claim, and the two
  domains are signed with different secrets. Each guard binds its own key from
  `ConfigService` rather than inheriting one — see invariant 19, which exists
  because a guard that inherited its key accepted a token from the wrong domain.
- Gated modules: `@RequireFlag('X')` + `@UseGuards(FeatureFlagGuard)` →
  `501 module_disabled` when off, and the service refuses with
  `501 <module>_inactive` when on. Never `503`.
- API prefix `/api`, global `ValidationPipe({ whitelist: true, transform: true })`, helmet + CORS.

---

## 5. DevOps / Ops track
- Learn the Terraform stack (`infra/terraform/`): VPC → ALB → ECS Fargate → RDS, S3+CloudFront, ECR, Secrets Manager, one workspace per env.
- Learn the **Deploy** workflow (build → ECR → `update-service --force-new-deployment` → wait stable).
- Read the **Ops Runbook**, noting that every procedure in it is untested and
  refers to resources that do not exist. A restore drill is not possible: there
  is no staging environment and no RDS instance to restore.
- Know where secrets live (Secrets Manager `openrwa-<env>/app`) and how rotation works.
- **There is nothing to set up yet.** No CloudWatch alarm, dashboard, SNS topic
  or error-tracking integration exists anywhere in the repository, and there is
  no on-call rotation. `infra/terraform/` creates log groups only.

## 6. Admin / Compliance track
- Read the **Admin Manual**. Get a least-privilege account.
- Practice **locally** — there is no staging environment: create a KYC case →
  screen → review (approve/reject with notes) and observe the audit log entry.
- Understand that `screen` is an **illustrative stub** that contacts no
  sanctions, PEP or adverse-media provider, and that its `clear_stub` result
  must never be presented as a completed screening.
- KYC approval currently gates nothing: the investor-facing actions it would
  gate all return `501`.
- Note that a review records who decided but **not when** — `reviewedAt` is
  never written. Known defect.

## 7. Content editor track
- Read the CMS section of the Admin Manual. Get a CMS editor account.
- Practice locally: create an Asset Program → add an Asset Record (lot + COA
  reference) → create a Passport → publish → verify the public passport page in
  EN/ES/IT at `/<locale>/passports`. The website reads the CMS's public
  endpoint, so the CMS must be running; with it stopped the index renders empty
  and a passport URL returns 404 rather than an error.
- Keep every figure **illustrative**, keep the disclosure intact, never expose internal-only fields.

---

## 8. Where to find things
| Need | Source |
| --- | --- |
| Build plan, PRD, wireframes, roadmap | Notion **Build Plan** and child pages — **not in this repository** |
| Intended operations procedure | `docs/RUNBOOK.md` (untested) |
| How the product works | `docs/USER-MANUAL.md`, `docs/ADMIN-MANUAL.md` |
| Rules every change must preserve | `APPLY-ORDER.md` (invariants), `AGENTS.md` |
| Known defects and security posture | `SECURITY.md` |
| Code | GitHub `openrwa` |
| Infra | `infra/terraform/` + its README |

## 9. Glossary
- **DAP / Passport** — Digital Asset Passport: a program-level provenance
  record published from the CMS.
- **PoR** — Proof-of-Reserves (attestation that reserves back circulating supply). Inactive.
- **KYC / KYB** — identity verification for individuals / entities.
- **ORWA** — the illustrative token symbol.
- **Gated module** — a module that refuses every request with `501`, both at
  its flag guard and in its service. The flag does not enable it.
- **Expand/contract** — backward-compatible migration pattern.

## 10. 30-day ramp (suggested)
Adjusted to what is actually possible today — the original plan assumed CI, a
staging environment, deploys and an on-call rotation, none of which exist.

- **Week 1:** local environment running (four services + two Postgres
  containers); read `AGENTS.md`, `APPLY-ORDER.md` and `SECURITY.md`; ship a
  small PR verified with the local matrix.
- **Week 2:** own a small feature or bug end-to-end, including its e2e spec.
- **Week 3:** shadow a KYC review locally; read the Ops Runbook critically and
  correct anything it claims that the code does not do.
- **Week 4:** work through one pending overlay from `APPLY-ORDER.md`, applying
  the invariant checks — every overlay so far has shipped at least one defect.
