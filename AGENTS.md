# AGENTS.md — ReserveChain.io

Instructions for AI coding agents working in this repository. Read this file completely before
making any change. If a requested change conflicts with the Compliance guardrails below, stop and
say so in the pull request description instead of implementing it.

## 1. What this project is

ReserveChain is an institutional RWA (real-world asset) tokenization platform for industrial
metals (Copper Powder, Nickel Wire). It is **pre-launch**. Nothing is being offered or sold.
The build follows a 22-phase plan (P1-P22); the authoritative specification lives in Notion and
is mirrored into `docs/`.

## 2. Repository layout (actual)

| Path | Stack | Purpose |
| --- | --- | --- |
| `/` (`src/`) | Next.js 14 App Router, TypeScript, Tailwind, next-intl | Public website, locales `en` / `es` / `it` under `src/app/[locale]/` |
| `api/` | NestJS 10, Prisma, PostgreSQL | REST API for web + admin + future mobile |
| `admin/` | Next.js | Internal admin console, reads the API server-side |
| `contracts/` | Solidity, Foundry, OpenZeppelin v5 | ERC-20 token, deploy and role scripts, tests |
| `infra/wallets/` | Docs + templates | Gnosis Safe setup, role matrix, wallet inventory |
| `cms/` | Payload CMS | **Not created yet** (P10) |
| `mobile/` | React Native (Expo) | **Not created yet** (P13) |
| `infra/` (Terraform) | Terraform, AWS | **Not created yet** (P19) |
| `docs/` | Markdown | **Not created yet** (P21) |

Do not restructure existing folders. When adding a workstream that does not exist yet, create it
at the path in the table above.

## 3. Current API modules (`api/src/app.module.ts`)

`PrismaModule`, `HealthModule`, `WaitlistModule`, `AssetsModule`, `PassportsModule`,
`TokenomicsModule`, `DashboardModule`, `SensitiveModule`, `ChainSyncModule`.
`ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })` and `ScheduleModule.forRoot()` 
must be preserved when editing `app.module.ts`.

## 4. Prisma models (`api/prisma/schema.prisma`)

`AssetProgram`, `AssetRecord`, `Passport`, `WaitlistEntry`, `ChainEvent`, `TokenomicsConfig`.

- Never edit an applied migration. Add a new migration with a descriptive name:
  `npx prisma migrate dev --name p6_auth_kyc`.
- `WaitlistEntry` holds personal data. Any endpoint returning it must be role-guarded.
- `TokenomicsConfig.data` is the source of tokenomics values. Read from it; do not inline numbers.

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
