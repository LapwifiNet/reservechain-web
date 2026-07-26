# ReserveChain — Pending Overlay Bundle

Every overlay package in this bundle exists in the Notion Build Plan but has **not**
yet been applied to `LapwifiNet/reservechain-web`. Verified against `main` on
2026-07-26.

## Do not re-apply these

The following overlays are ALREADY in the repository and are deliberately excluded
from this bundle. Re-applying any of them would overwrite later hardening work:

`reservechain-web` · `reservechain-contracts` · `reservechain-api` ·
`reservechain-admin` · `reservechain-p4-wallets` · `reservechain-p6-auth-kyc` ·
`reservechain-audit-log` · `reservechain-demo-seed` · `reservechain-ci`

Specifically, `reservechain-p6-auth-kyc.zip` contains an `app.module.ts` that has no
`APP_GUARD` / `ThrottlerGuard` registration, and a `seed.ts` with the default
passwords `ReserveAdmin!23` / `ReserveCMS!23`. Both were fixed on `main`. Applying
that overlay again silently reintroduces an unauthenticated brute-force surface on
`POST /api/auth/login` and commits default credentials.

## Apply order

This order comes from the Handover Package page and respects the dependency chain.
Apply one overlay per commit. Run `git diff` before every commit.

| # | Archive | Extract root | Copy to | Notes |
|---|---|---|---|---|
| 1 | reservechain-admin-login.zip | `admin/` (+ LOGIN-README.md) | `admin/` | Per-user JWT, httpOnly cookie, middleware. Unblocks attributable KYC reviews |
| 2 | reservechain-waitlist-wire.zip | `waitlistwire/` | `web -> root`, `api -> api/` | Migration `waitlist_website_fields` |
| 3 | reservechain-kyc-admin.zip | `kycadmin/` | `admin/` | Full KycConsole with review + screen. Supersedes the read-only `/kyc` page currently on main |
| 4 | reservechain-investor-portal.zip | `p8/` | `api -> api/`, `web -> root` | Migration `investor_portal` |
| 5 | reservechain-backend-tests.zip | `p8tests/` | `api/` | Reconcile with the existing `api/jest.config.js` |
| 6 | ~~reservechain-cms.zip~~ | `cms/` | `cms/` | **Applied.** Payload, own DB `reservechain_cms` on 5433, port 3001. Seed credential stripped; `PAYLOAD_SECRET` is a third disjoint token domain |
| 7 | reservechain-webdap.zip | `webdap/` | root (`src/` + `messages/`) | Merge locale JSON, do not overwrite |
| 8 | reservechain-por-redemption.zip | `porredemption/` | `api/` | Migration `por_redemption`. Ships flags OFF |
| 9 | reservechain-wallet-purchase.zip | `walletpurchase/` | `api/` | Migration `wallet_purchase`. Ships flags OFF |
| 10 | reservechain-infra-terraform.zip | `infra/` | `infra/terraform/` | `plan` only until AWS account exists |
| 11 | reservechain-ci-deploy.zip | `cideploy/` | `.github/` | Needs `AWS_DEPLOY_ROLE_ARN` + OIDC |
| 12 | reservechain-ops-runbook.zip | `runbook/` | `docs/` | |
| 13 | reservechain-manuals.zip | `manuals/` | `docs/` | |
| 14 | reservechain-training.zip | `training/` | `docs/` | |
| 15 | reservechain-mobile-e2e.zip | `mobile/` | `mobile/` | Expo app WITH testIDs + `.maestro/`. Supersedes `reservechain-mobile.zip` — do not use the older one |
| 16 | reservechain-acceptance-qa.zip | `qa/` | `docs/` | |
| 17 | reservechain-mobile-e2e-ci.zip | `mobilee2eci/` | `.github/workflows/` | |

### Independent of the chain — apply any time

| Archive | Extract root | Copy to |
|---|---|---|
| reservechain-monitoring.zip | `monitoring/` | `infra/terraform/` + app Sentry init |
| reservechain-loadtest-k6.zip | `perf/` | `perf/` |
| reservechain-seo-analytics.zip | `seo/` | root `src/` |
| reservechain-a11y.zip | `a11y/` | root |
| reservechain-i18n-qa.zip | `i18nqa/` | root `messages/` (diff, do not overwrite) |

## Migration order

`p6_auth_kyc` (already applied) -> `waitlist_website_fields` -> `audit_log`
(verify: may already exist) -> `investor_portal` -> `por_redemption` ->
`wallet_purchase`

## Invariants that must survive every overlay

Check these after each apply. They were all added after the overlays were authored,
so a blind `cp -R` can silently revert them.

1. `api/src/app.module.ts` — `{ provide: APP_GUARD, useClass: ThrottlerGuard }` is
   present, and the global throttler baseline stays at `limit: 100`, with
   `@Throttle({ default: { limit: 5, ttl: 60000 } })` on `AuthController.login`.
2. `api/prisma/seed.ts` — no hard-coded passwords; reads `SEED_ADMIN_PASSWORD`,
   `SEED_COMPLIANCE_PASSWORD`, `SEED_VIEWER_PASSWORD`; skips seeding in production.
3. `api/src/auth/auth.module.ts` — throws when `JWT_SECRET` is missing or shorter
   than 32 characters. No `dev-insecure-secret-change-me` fallback.
4. `api/src/main.ts` — `SERVICE_API_TOKEN` length check, `helmet()`, global `api`
   prefix, `ValidationPipe({ whitelist: true, transform: true })`.
5. `admin/.eslintrc.json` exists and the `admin` CI job runs `npm run lint`.
6. Root `docker-compose.yml`, `docker-compose.dev.yml`, `.env.docker.example` intact.
7. `.github/dependabot.yml` still ignores major bumps for `next`, `react`,
   `react-dom` at root and in `admin`.
8. `admin/package.json` stays on the Next 14 / ESLint 8 axis.
9. No `.env`, private key, mnemonic or real credential is committed. New variables
   go to the relevant `.env.example` with placeholder values.
10. Gated modules stay inactive: PoR, redemption, wallet connect and purchase must
    not become reachable. Flags default OFF.
11. `admin/src/lib/api.ts` retains `audit()`, `auditVerify()`, `kycStats()`,
    `kycCases(take?)` and `kycCase(id)`, and takes its bearer token from
    `getToken()`.
12. `admin/src/lib/backend.ts` never falls back to `API_TOKEN` /
    `SERVICE_API_TOKEN`. All KYC writes from the console use the session cookie
    only and 401 without it. This is the client-side half of the rule; the
    server-side half is invariant 16.
13. Admin `KycCase` field names track `api/prisma/schema.prisma`: `legalName`
    (not `subjectName`), `subjectType` `person` / `entity`, nullable
    `riskLevel`. Amended in `c1c09d9`: nullable `email` and `sanctions` now
    exist on the Prisma model, added additively so the email-matched KYC card
    works, with `CreateKycCaseDto.email` optional and redacted by
    `AuditInterceptor`. They must stay nullable and must not be typed the way
    the kyc-admin overlay typed them.
14. `AuditInterceptor.sanitizeBody` keeps `piiFields` wired in, so KYC subject
    names are redacted from the audit trail.
15. `admin/src/app/audit/page.tsx` is a client component and must not import
    `@/lib/api`, which is server-only via `next/headers`. It calls the
    `/api/audit` and `/api/audit/verify` proxy routes.
16. `JwtAuthGuard` keeps `assertServicePrincipalMayProceed`: the shared service
    token is a read-only principal, refused with
    `403 service_principal_write_denied` on POST / PATCH / PUT / DELETE. The
    rule lives in the guard, not in controllers, because `RolesGuard` compares
    only `role` and the service principal carries `Role.ADMIN`.
    `@AllowServiceWrite()` is the sole opt-in and is currently applied to no
    route — every new use of it is a deliberate hole and must be justified in
    review.
17. `CreateWaitlistDto.consent` uses `@Equals(true)`, not bare `@IsBoolean()`.
    The website is a thin proxy, so the API is the only consent enforcement
    point, and `@IsBoolean()` alone accepts `false`.
18. The website owns no waitlist store. `src/lib/store.ts` and
    `src/db/schema.sql` are deleted and must not return; the API is the single
    source of truth. `WAITLIST_API_BASE` is server-side only and must never
    become `NEXT_PUBLIC_`, and the website sends no credential to it.
19. The investor and admin token domains stay disjoint. `INVESTOR_JWT_SECRET`
    is a separate secret, at least 32 characters, and the API refuses to start
    if it equals `JWT_SECRET`. Every token carries an explicit `typ`;
    `JwtAuthGuard` accepts only `typ: 'admin'` and `InvestorJwtGuard` only
    `typ: 'investor'`, and a missing `typ` is rejected by both. Do not add a
    backward-compatibility default — that would reopen the domain merge in one
    line.

    **Separate secrets only hold if the guard binds its own key.** Both guards
    read their secret from `ConfigService` and pass it explicitly to
    `verifyAsync`. A guard that instead relies on the injected `JwtService`'s
    configured secret satisfies this invariant on paper and violates it at
    runtime: Nest instantiates `@UseGuards(...)` enhancers in the injector of
    the module that DECLARES the controller, not the module that exports the
    guard, so the key becomes a property of where the guard is mounted. Such a
    guard is correct only while every mounting module's imports happen to
    resolve the intended `JwtModule`, and the failure mode is a token from the
    wrong domain being accepted — silently, and invisible to code review, since
    the mount site looks identical either way. This is not hypothetical: it
    happened to `InvestorJwtGuard` in `RedemptionModule`, which verified
    investor tokens with `JWT_SECRET` and accepted an admin-signed token on an
    investor route. Exporting the guard from its owning module does not fix it.
    Pinned at every mount point by `test/guard-key-binding.e2e-spec.ts`.
20. Investors never enter `AdminUser`, and no investor value is added to the
    `Role` enum. `Role` feeds `@Roles(...)` on admin routes; widening it would
    grant investors admin-route standing by construction.
21. `AuditService.record()` serializes with a `pg_advisory_xact_lock` inside a
    transaction, and `AuditInterceptor` awaits the write as part of the request
    stream. The audit table is a single tamper-evident hash chain, so two
    concurrent appends can fork it, and a forked chain fails verification
    permanently with no repair path. Do not remove the lock as a performance
    optimisation. `maxWorkers: 1` in the e2e config is the test-side half of the
    same constraint.
22. The sanctions value on a KYC case is a stub. `screen()` persists the literal
    `clear_stub`. No surface — admin console, investor portal, API response, or
    export — may render it as a clean sanctions result or drop the stub label.
    Until a real provider is wired, presenting it as a screening outcome would
    be a compliance misrepresentation, not a UI detail.
23. The KYC case-list endpoint must not return `email`. It is excluded by an
    explicit `select`. The detail endpoint may return it because it is
    role-guarded and a reviewer needs the link.
24. The CMS is a **third** token domain, disjoint from the other two.
    `PAYLOAD_SECRET` must be at least 32 characters, must differ from both
    `JWT_SECRET` and `INVESTOR_JWT_SECRET`, and has no fallback — the service
    refuses to boot otherwise. An admin or investor JWT must resolve to
    `user: null` on the CMS, and a CMS write with an API token must be refused.
25. The CMS owns its own database on its own Postgres instance. Zero CMS tables
    may appear in the API's database. Do not consolidate them into one
    instance: the Postgres image runs init scripts only on a first-time empty
    data directory, so a second database added that way is silently skipped on
    every existing volume.
26. **A booting CMS is not a working CMS.** Payload auto-pushes schema only in
    development. Under `NODE_ENV=production` it does neither, so the service
    starts, serves `/health` and `/admin`, and 500s on every database request.
    Committed migrations plus a migrate step in the entrypoint are mandatory,
    and the check that proves it is a real data request such as
    `GET /api/passports?limit=1`, never a health probe.
27. Every user-facing surface that shows a sanctions value must carry the stub
    wording in **all three locales**. The stored value `clear_stub` is not a
    label. See the Open items entry — this shipped as a bare "Clear" and
    reached users.
28. `CMS_API_BASE` is server-side only, must never become `NEXT_PUBLIC_`, and
    carries no credential — the same rule as `WAITLIST_API_BASE`.
29. Public pages degrade, they do not fail. A CMS or API outage must render
    `notFound()` or a degraded page, never a 500, on any unauthenticated
    marketing surface. Do not add a health-gated `depends_on` from the website
    to the CMS: it converts a degraded page into a website that will not start.
30. Exactly one passport surface exists, and it is the CMS-backed one at
    `/passports`. The hardcoded `/passport/:id` route was retired because it
    rendered invented per-unit content while holding the navigation link, which
    AGENTS §3 forbids. Do not reintroduce a passport page backed by fixtures,
    and keep the permanent redirect: the old URLs were linked from the nav, the
    home page and the registry table.
31. The gated-module contract is **501**, everywhere. `SensitiveController`,
    `FeatureFlagGuard` and the admin console's gated notices on `/reserves` and
    `/redemption` all state 501; the PoR/redemption overlay shipped 503, which
    would have made the console's rendered code wrong. One rule, one number.
32. A feature flag is the outer wall, not the only one. The Proof-of-Reserves
    and Redemption services refuse every call and import no `PrismaModule`, so
    enabling `PROOF_OF_RESERVES_ENABLED` or `REDEMPTION_ENABLED` moves the
    refusal from the guard to the service and activates nothing. AGENTS §2
    requires this — "do not wire them to real logic, even behind a feature flag
    that defaults on" — and the overlay shipped complete working
    implementations, including a public endpoint that would have served a
    computed reserve-coverage ratio. Do not reinstate the logic when
    implementing: that is a reviewed piece of work under written
    authorization, not the removal of a `throw`.
33. `ReserveAttestation` and `RedemptionRequest` are published shape. Their
    tables exist and must stay empty: nothing reads or writes them, no seed
    touches them, and no fixture reserve figure, custodian, auditor, vault or
    coverage ratio may be introduced. A fabricated reserve number is the most
    damaging fabrication this repository could ship.
34. `InvestorJwtGuard` binds its own signing key: it reads
    `INVESTOR_JWT_SECRET` from `ConfigService` and passes it explicitly to
    `verifyAsync`. Do not "simplify" this back to relying on the injected
    `JwtService`'s configured secret. Nest instantiates `@UseGuards(...)`
    enhancers in the injector of the module declaring the controller, not the
    module exporting the guard, so a second module mounting it gets whichever
    `JwtService` its own imports resolve. That is not theoretical: when
    RedemptionModule mounted this guard alongside `AuthModule`, it verified
    investor tokens with `JWT_SECRET`, and a token carrying `typ: 'investor'`
    signed with the ADMIN key passed the guard — invariant 19 defeated by a
    module import, in the direction that puts staff tokens on investor routes.
    Exporting the guard does not fix it; binding the secret does. Pinned by
    `test/gated-modules.e2e-spec.ts`.
35. Nothing in this repository holds, requests, logs or persists a private key,
    mnemonic, seed phrase or signer metadata — not in code, tests, fixtures,
    example env files or the schema. Wallet linking records a public address
    only. Proof of control is a signature the holder produces; it is never a
    secret this platform receives. The wallet/purchase overlay shipped none of
    it, and that must stay true when the module is implemented.
36. `LinkWalletDto.chainId` uses `@IsIn([11155111])`, not `@IsInt()`. The
    overlay accepted any integer with only a comment saying mainnet was not
    permitted, so `chainId: 1` validated — a published contract accepting an
    Ethereum mainnet address on a testnet-only platform. AGENTS §1 puts that
    constraint in code, not in prose.
37. The purchase module quotes no price and computes no amount. `tokenAmount`
    is client-supplied, `quoteCurrency` is an ISO-4217 code with no value
    attached, and no fee, rate or valuation exists anywhere in it. Introducing
    one requires a figure from `TokenomicsConfig` or the frozen illustrative
    set (AGENTS §4), never a literal.
