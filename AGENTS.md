# AGENTS.md — OpenRWA.io

Instructions for AI coding agents working in this repository. Read this file completely before
making any change. If a requested change conflicts with the Compliance guardrails below, stop and
say so in the pull request description instead of implementing it.

Before applying any overlay package, `APPLY-ORDER.md` is mandatory reading: it holds the
apply order and invariants 1–63, which must survive every apply.

## 1. What this project is

OpenRWA is an institutional RWA (real-world asset) tokenization platform for industrial
metals (Copper Powder, Nickel Wire). It is **pre-launch**. Nothing is being offered or sold.
The build follows a 22-phase plan (P1-P22). The authoritative **specification** lives in Notion;
**only the screen registry + decision log are mirrored** into this repository (one-way sync from
Notion, read-only — never edit the YAML to change the spec, edit Notion and re-sync):

| File | What it is |
| --- | --- |
| `docs/spec/screens.yaml` | 80 screen ids (D6), status done/partial/missing/conflict, routes, regions, gaps — CI-gated by `verify:screens` |
| `docs/spec/decisions.yaml` | D1–D6 spec↔guardrail conflict decisions; closing one forces conflict screens to update |

`docs/` otherwise holds operational and onboarding documentation only:

| File | What it is |
| --- | --- |
| `docs/RUNBOOK.md` | Intended operations procedure — deploy, rollback, backup/restore, incident response. **Never exercised**; see its status block |
| `docs/USER-MANUAL.md` | The product as built, for visitors and investors |
| `docs/ADMIN-MANUAL.md` | The product as built, for ADMIN / COMPLIANCE staff |
| `docs/TRAINING.md` | Onboarding guide for new contributors |

Do **not** assume a local copy of the brief, PRD, wireframes, design system or roadmap exists —
none of those are in `docs/`, and Notion remains the only source for them (the two YAML mirrors
above are the sole exception). What is in-repo, and
authoritative there, is `AGENTS.md` (these rules), `APPLY-ORDER.md` (the apply order and the
invariants every change must preserve), `SECURITY.md` (known defects and security posture) and
`TRADEMARKS.md` (what the Apache-2.0 licence does and does not cover).

## 2. Repository layout (actual)

| Path | Stack | Purpose |
| --- | --- | --- |
| `/` (`src/`) | Next.js 14 App Router, TypeScript, Tailwind, next-intl | Public website, locales `en` / `es` / `it` under `src/app/[locale]/` |
| `api/` | NestJS 10, Prisma, PostgreSQL | REST API for web + admin + future mobile |
| `admin/` | Next.js | Internal admin console, reads the API server-side |
| `contracts/` | Solidity, Foundry, OpenZeppelin v5 | ERC-20 token, deploy and role scripts, tests |
| `infra/wallets/` | Docs + templates | Gnosis Safe setup, role matrix, wallet inventory |
| `cms/` | Payload v2 CMS on Express, PostgreSQL | Asset registry + public Digital Asset Passports, port 3001, own database `openrwa_cms` |
| `mobile/` | React Native (Expo SDK 51), Expo Router, TypeScript | iOS + Android app, investor domain only. Verified with lint + `tsc`, **web export** (Playwright 11/11, 2026-08-02), and an **Android debug APK** on the `Linken_AdMachine` emulator (Maestro 01/02/03/04 pass; 05/06 blocked on CMS port conflict). Store builds still untested — needs Apple/Play accounts |
| `infra/terraform/` | Terraform, AWS | VPC, ALB, ECS Fargate, RDS, S3/CloudFront, ECR, Secrets Manager. Verified with `validate` / `fmt`, never applied from this repository |
| `docs/` | Markdown | Runbook, user + admin manuals, training guide. **Not** the specification — that stays in Notion (P21) |

Do not restructure existing folders. When adding a workstream that does not exist yet, create it
at the path in the table above.

## 3. Current API modules (`api/src/app.module.ts`)

`PrismaModule`, `HealthModule`, `WaitlistModule`, `AssetsModule`, `PassportsModule`,
`TokenomicsModule`, `DashboardModule`, `SensitiveModule`, `ChainSyncModule`, `AuthModule`,
`KycModule`, `AuditModule`, `InvestorModule`, `ProofOfReservesModule`, `RedemptionModule`,
`WalletModule`, `PurchaseModule`.

`InvestorModule` is the public investor portal and owns its own token domain
(`INVESTOR_JWT_SECRET`, `typ: 'investor'`) — see guardrail 2 and invariant 19.

`ProofOfReservesModule`, `RedemptionModule`, `WalletModule` and `PurchaseModule` are
**inert**. Each is class-gated by a feature flag that defaults false AND refuses in its
service, so every route answers `501` in both flag states: `module_disabled` at the guard
when the flag is off, `*_inactive` at the service when it is on. Turning a flag on
activates nothing.
`ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })` and `ScheduleModule.forRoot()` 
must be preserved when editing `app.module.ts`.

## 4. Prisma models (`api/prisma/schema.prisma`)

`AssetProgram`, `AssetRecord`, `Passport`, `WaitlistEntry`, `ChainEvent`, `TokenomicsConfig`,
`AdminUser`, `KycCase`, `InvestorUser`, `AuditEvent`, `ReserveAttestation`,
`RedemptionRequest`, `Wallet`, `PurchaseIntent`.

`ReserveAttestation`, `RedemptionRequest`, `Wallet` and `PurchaseIntent` are published
**shape only**. Their tables exist and must stay empty: the four gated services touch no
database and import no `PrismaModule`, and no seed references them.

- Never edit an applied migration. Add a new migration with a descriptive name:
  `npx prisma migrate dev --name p6_auth_kyc` or `npx prisma migrate dev --name p9_audit_log`.
- `WaitlistEntry` holds personal data. Any endpoint returning it must be role-guarded.
- `TokenomicsConfig.data` is the source of tokenomics values. Read from it; do not inline numbers.
- `AuditEvent` is append-only. Never provide update or delete routes for audit records.

## 5. Compliance guardrails (non-negotiable)

These come from the project owner's brief. Violating any of them is a blocking defect.

1. **Testnet only.** Deploy targets are Sepolia. Never add mainnet RPC URLs, mainnet chain IDs,
   or mainnet deploy steps. Mainnet requires written authorization (P20).
2. **Gated modules stay inactive.** Proof-of-Reserves, redemption, wallet connect and token
   purchase must remain non-functional: API returns HTTP `501` with a clear message, UI renders a
   gated notice. Do not wire them to real logic, even behind a feature flag that defaults on.
3. **No fabricated data.** Never invent quantities, certificates, custodians, insurers,
   valuations, token prices, or contract addresses. Sample data must be labeled `Illustrative`.
4. **No hard-coded tokenomics.** Supply, allocations, reserve ratio, fees and thresholds come from
   `TokenomicsConfig` or `contracts/config/tokenomics.example.json`.
5. **Disclosure text is verbatim.** The prelaunch disclosure in the footer and Legal page must not
   be reworded, shortened, or translated loosely. Treat its string as frozen content.
6. **Language discipline.** Use "proposed / planned / in development / subject to final approval".
   Never imply tokens are sold, issued, traded or redeemable. Never claim "MiCA-compliant".
   Do not add EU/EEA targeting.
7. **Secrets.** Never commit `.env`, private keys, mnemonics, or API tokens. Add new variables to
   `.env.example` with placeholder values and document them in the relevant README.
8. **Personal data.** Waitlist and KYC data is PII. No logging of email addresses or document
   contents, no unauthenticated read endpoints, no export routes without role checks.

## 6. Coding conventions

- TypeScript strict mode. No `any` in new code unless narrowing an untyped third-party payload.
- Follow the existing ESLint config in each package; run lint before opening a pull request.
- NestJS: one folder per module with `*.module.ts`, `*.controller.ts`, `*.service.ts`. Validate
  input with DTOs and `class-validator`.
- Next.js: server components by default; use `next-intl` for every user-facing string. No
  hard-coded English text in JSX. Add keys to all three locale files (`en`, `es`, `it`).
- Solidity: OpenZeppelin v5 base contracts, `AccessControl` for roles, explicit custom errors,
  named imports.
- Commit messages follow Conventional Commits: `feat(api): ...`, `fix(web): ...`, `ci: ...`,
  `chore(docs): ...`.

## 7. Testing requirements

| Area | Command | Bar |
| --- | --- | --- |
| Web | `npm run lint && npm run build` at repo root | Build must pass |
| API | `cd api && npx prisma generate && npm run build && npm run test:e2e` | All specs pass |
| Admin | `cd admin && npm run build` | Build must pass |
| Contracts | `cd contracts && forge build --sizes && forge test -vvv` | All tests pass, coverage >= 90% before audit |

Add tests with every behavioural change. A pull request that changes API behaviour without a
corresponding e2e spec is incomplete.

## 8. Pull request rules

- One phase or one concern per pull request. Do not mix a feature with a refactor.
- Title: `feat(api): P6 auth + RBAC guards` — always reference the phase number.
- Description must include: what changed, which spec it implements, how it was tested, new
  environment variables, and any compliance guardrail that was relevant.
- Never force-push to `main`. Never modify files under `.github/workflows/` and application code
  in the same pull request.
- If a task is under-specified, open the pull request as a draft and list the open questions
  rather than guessing at business rules.

## 9. Definition of done (from the project brief)

A phase is complete only when: deliverables are complete, the code runs on the correct
environment, it is committed to this repository, tests pass with evidence, documentation is
updated, the owner can self-test it, there is no critical defect, and written acceptance has
been given.
