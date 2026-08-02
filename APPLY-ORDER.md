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
| 1 | ~~reservechain-admin-login.zip~~ | `admin/` (+ LOGIN-README.md) | `admin/` | Per-user JWT, httpOnly cookie, middleware. Unblocks attributable KYC reviews **Applied** · `dbce350` |
| 2 | ~~reservechain-waitlist-wire.zip~~ | `waitlistwire/` | `web -> root`, `api -> api/` | Migration `waitlist_website_fields` **Applied** · `a5d4e66` |
| 3 | ~~reservechain-kyc-admin.zip~~ | `kycadmin/` | `admin/` | Full KycConsole with review + screen. Supersedes the read-only `/kyc` page currently on main **Applied** · `823bb90` |
| 4 | ~~reservechain-investor-portal.zip~~ | `p8/` | `api -> api/`, `web -> root` | Migration `investor_portal` **Applied** · `c1c09d9` |
| 5 | ~~reservechain-backend-tests.zip~~ | `p8tests/` | `api/` | Reconcile with the existing `api/jest.config.js` **Applied** · `428f354` |
| 6 | ~~reservechain-cms.zip~~ | `cms/` | `cms/` | **Applied.** Payload, own DB `reservechain_cms` on 5433, port 3001. Seed credential stripped; `PAYLOAD_SECRET` is a third disjoint token domain |
| 7 | ~~reservechain-webdap.zip~~ | `webdap/` | root (`src/` + `messages/`) | Merge locale JSON, do not overwrite **Applied** · `b97508b` |
| 8 | ~~reservechain-por-redemption.zip~~ | `porredemption/` | `api/` | Migration `por_redemption`. Ships flags OFF **Applied** · `8440a14` |
| 9 | ~~reservechain-wallet-purchase.zip~~ | `walletpurchase/` | `api/` | Migration `wallet_purchase`. Ships flags OFF **Applied** · `5347731` |
| 10 | ~~reservechain-infra-terraform.zip~~ | `infra/` | `infra/terraform/` | `plan` only until AWS account exists **Applied** · `77ca002` |
| 11 | ~~reservechain-ci-deploy.zip~~ | `cideploy/` | `.github/` | Needs `AWS_DEPLOY_ROLE_ARN` + OIDC **Applied** · `40f0e7d` |
| 12 | ~~reservechain-ops-runbook.zip~~ | `runbook/` | `docs/` | **Applied** · `e1248a3` |
| 13 | ~~reservechain-manuals.zip~~ | `manuals/` | `docs/` | **Applied** · `c0ebe13` |
| 14 | ~~reservechain-training.zip~~ | `training/` | `docs/` | **Applied** · `7b44a81` |
| 15 | ~~reservechain-mobile-e2e.zip~~ | `mobile/` | `mobile/` | Expo app WITH testIDs + `.maestro/`. Supersedes `reservechain-mobile.zip` — do not use the older one |
| 16 | ~~reservechain-acceptance-qa.zip~~ | `qa/` | `docs/` | **Applied.** Rewritten to actual status; 7 items describe features that do not exist |
| 17 | ~~reservechain-mobile-e2e-ci.zip~~ | `mobilee2eci/` | `.github/workflows/` | **Applied.** Dispatch-only; backend flows gated behind a disposable-target confirmation |

### Ordered chain: COMPLETE

All seventeen ordered overlays are applied. Every one of them shipped at least
one defect — see the notes above and the commit messages. Nothing in the ordered
chain remains.

### Independent of the chain — three of five applied

| # | Archive | Status |
|---|---|---|
| 18 | ~~reservechain-a11y.zip~~ | **Applied.** axe over 34 routes x 3 locales; four real defects fixed, one of them critical |
| 19 | ~~reservechain-seo-analytics.zip~~ | **Applied in part.** Sitemap, robots and canonicals applied; the analytics and consent-banner half deleted unapplied |
| 20 | ~~reservechain-i18n-qa.zip~~ | **Reconciled, catalogues not applied.** One check adopted into the existing parity test; four of the other five redundant or contradictory |

Two remain, neither applied:

| Archive | Would touch | Anything depend on it? |
|---|---|---|
| reservechain-monitoring.zip | `infra/terraform/` (alarms, dashboards, SNS) + an error-tracking SDK in each app | **Yes, by absence.** `docs/RUNBOOK.md` and the acceptance checklist both record "no alerting, no dashboards, no on-call" as gaps. This overlay is what would close them. Note it would introduce the project's FIRST telemetry SDK — an AGENTS §8 decision to make deliberately, not inherit (invariant 53) |
| reservechain-loadtest-k6.zip | a new `perf/` directory | No. Nothing references it. Load-testing an unapplied stack has little meaning until something is deployed |

**What has to be true before monitoring can be applied.** An alarm names a
resource, so the Terraform stack has to have been applied at least once —
today it never has: there is no state, no backend, and `AWS_DEPLOY_ROLE_ARN`
does not exist, so every alarm would reference an ARN nobody can resolve and
`terraform plan` would be the only thing anyone could run. It also needs a
decision the repository has never made: which error-tracking SDK, in which of
the five packages, sending what to whose account. That is the project's first
telemetry of any kind, and the same reason the analytics half of overlay #19
was deleted rather than applied applies here — a privacy position first, an
SDK second. Finally an alarm needs a destination: an SNS topic is not an
on-call rotation, and `docs/RUNBOOK.md` records that there is no rotation and
no owner to page. Applying it before those three things exist produces
infrastructure that cannot be planned, telemetry nobody chose, and alerts
nobody receives.

**What has to be true before loadtest-k6 can be applied.** An environment
worth measuring. Nothing is deployed: no API host, no database outside
`docker compose`, no CDN in front of the website. Run against compose on a
laptop it measures the laptop, and a number produced that way is worse than no
number because it gets quoted later. It also needs a target to compare
against — there is no latency or throughput budget written down anywhere in
this repository — and a decision about data, since a load test that exercises
`POST /waitlist` writes registration rows (invariant 57 covers exactly this
for the mobile E2E job and applies unchanged here).

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
    AGENTS §3 forbids. A per-unit page may exist only when every displayed
    value comes from a published CMS `asset-records` document; with no
    published record the route must 404 (decision D1, 2026-08-03 — this is
    "no fixtures", not "no per-unit"). Fixtures stay banned. Keep the
    permanent redirect: the old URLs were linked from the nav, the home page
    and the registry table.
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
38. Sepolia is enforced in variable validation, never in a description. The
    Terraform `chain_id` variable uses `validation { condition = var.chain_id ==
    11155111 }`, matching `LinkWalletDto.chainId` in the API (invariant 36).
    AGENTS §1 has now been violated twice by the same mechanism — a rule stated
    in a comment or a variable description while the validator accepted
    anything — so treat prose about mainnet as documentation of an unenforced
    rule until you find the check.
39. No Terraform state, `*.tfvars`, `backend.hcl` or `.terraform/` directory is
    ever committed; only the `*.example` files are tracked. State holds
    `db_password`, `jwt_secret`, `investor_jwt_secret`, `payload_secret` and
    `service_api_token` in **plaintext** — `sensitive = true` hides values from
    CLI output, it does not encrypt state. The S3 backend is declared as a
    partial `backend "s3" {}` and configured from a gitignored `backend.hcl`,
    because a commented-out backend silently falls back to local state, which
    is how those secrets end up in an untracked file next to the code.
40. Infrastructure ships every gated-module flag disabled.
    `PROOF_OF_RESERVES_ENABLED`, `REDEMPTION_ENABLED`, `WALLET_ENABLED`,
    `PURCHASE_ENABLED` and `CHAIN_SYNC_ENABLED` are `"false"` in the api task
    definition, asserted by a `check` block. A task definition, parameter store
    entry or deploy workflow is a new place for a flag to be turned on by
    accident, and it is further from review than a `.env` file.
41. No secret, key, certificate, account id, real domain or ARN is committed in
    infrastructure code. Secrets reach containers only from Secrets Manager,
    injected as task `secrets` rather than baked into an image or task
    `environment`. Terraform variables carrying secrets validate a minimum
    length and reject the `REPLACE-ME` placeholder, so a misconfigured apply
    fails at plan time rather than as a crash-looping service.
42. Terraform is verified, never applied, from this repository:
    `terraform init -backend=false`, `terraform validate`, `terraform fmt
    -check -recursive`. Do not run `plan` or `apply` against real credentials
    as part of any automated check, and do not add a CI job that does.
43. Investor-domain mutations are audited. `AuditInterceptor` records mutating
    requests that are role-guarded **or** carry `@AuditAs('investor')`, which
    the investor, wallet, purchase and redemption controllers do. Those routes
    carry no `@Roles` deliberately — the `Role` enum feeds `@Roles(...)` on
    admin routes and must never gain an investor value (invariant 20) — so
    without the second clause they fall out of scope silently, which is how
    investor self-registration went unrecorded. The actor is the investor
    subject: `req.investor`, or the request body's email on register/login
    where no principal exists yet. `actorRole` is a plain String column, so
    `'investor'` is recorded without touching the enum. Never attribute an
    investor action to an admin or to the service principal.
44. Widening audit scope and proving redaction are one change, never two. The
    investor register body carries a password; recording it without redaction
    would convert an audit gap into a credential leak, which is strictly worse
    than the gap. `password` must land as `[REDACTED]` and `email` / `fullName`
    as `[PII_REDACTED]`, verified by reading the stored row back out of the
    database — not by reading `sensitiveFields` and assuming. Pinned by
    `test/investor-isolation.e2e-spec.ts`.
45. The deploy workflow never fires on a push. `workflow_dispatch` is its only
    trigger, and both jobs bind to a GitHub environment so protection rules
    apply. Work reaches `main` with no green CI on this repository, so a push
    trigger would deploy unreviewed commits. The environment binding is
    necessary, not sufficient: required reviewers must be configured on the
    `prod` environment, and a workflow cannot enforce that on itself. Deploying
    the api service runs `prisma migrate deploy` at container start, so
    approving a prod deploy is approving a production migration.
46. An overlay's Dockerfiles do not overwrite the ones on `main`. Every
    container image here carries corrections the overlays predate — the CMS
    migrate step (invariant 26), the API's openssl and entrypoint, non-root
    users. Overlay #11 shipped four Dockerfiles, all regressions, and its CMS
    image would have deployed a service that 500s on every database request.
    Diff before copying; prefer taking nothing.
47. Staff sign-ins are audited on both outcomes, and a rejected attempt is not
    an oracle. `POST /auth/login` carries `@AuditAs('staff', { outcomes: 'all'
    })`; failures are written with `actorId` dropped, `actorEmail` forced to
    `[PII_REDACTED]` and a generic `reason: 'rejected'`. `AuthService` raises
    the same `invalid_credentials` for an unknown account and a wrong password,
    so the row discloses nothing about which addresses exist — and it must stay
    that way, because this is an audit row created by an unauthenticated
    caller. Recording only successes would make a credential-stuffing run
    invisible, which is the case the trail most needs to cover.
48. Every mutation that persists a personal record is audited, including public
    unauthenticated ones. Investor registration and waitlist signup both create
    PII rows with nobody signed in; "there was no principal" is not a reason for
    a persisted personal record to have no audit event. The registrant is the
    actor. `sanitizeBody` redacts the body regardless.
49. Documentation is verified against the code before it ships, and says so
    when it describes something unexercised. Three separate documentation
    overlays shipped claims that were false of this repository — a smoke test
    checking for `503` when the contract is `501`, an admin manual stating a
    feature flag would activate a gated module, a training guide asserting the
    e2e suite needs no database and that CI must be green when CI has never
    run. Nothing compiles a prose claim, so a false one ships silently and is
    then trusted in an incident or on a first day. Any document describing a
    procedure that has not been performed must say so where a reader will see
    it, not in a footnote — `docs/RUNBOOK.md` and `.github/workflows/deploy.yml`
    are the pattern.
50. `reviewedBy` and `reviewedAt` are written together on a KYC decision, never
    separately. An attributed reviewer with no time is half a record: the
    decision cannot be placed against a sanctions list version, a document
    expiry, or anything else that moves. `reviewedAt` existed in the schema and
    was simply never written, so every reviewed case showed a blank field and
    the admin manual had to be corrected to say decisions were not timestamped.
    The same defect is pre-baked into `RedemptionRequest` and `PurchaseIntent`
    for whoever implements those.
51. `EXPO_PUBLIC_*` is published, not configured. Expo inlines those variables
    into the shipped bundle, so anyone who downloads the app can read them.
    Only values that are already public may go there — today, two base URLs for
    endpoints that serve unauthenticated callers. Never a token, key, signing
    secret or account identifier. The mobile client also has **no default host**:
    the overlay fell back to a real domain this project neither controls nor has
    deployed, which would have shipped inside a store binary.
52. The mobile app is investor-domain only, and presents no gated module. It
    authenticates solely against `/investor/{register,login,status}` with
    `INVESTOR_JWT_SECRET`-signed tokens, holds the session in
    `expo-secure-store`, and must never acquire an admin-domain capability or
    become a fourth token domain (invariants 19, 20, 24). It has no screen and
    no client method for proof-of-reserves, redemption, wallet linking or
    purchase, and must not gain one while those refuse with `501` — an app
    store listing reaches the public directly, so a rendered reserve figure or
    redemption form there is the most damaging fabrication this project could
    publish (invariant 33).
53. No wallet library, key storage, mnemonic handling, secure-enclave or
    signing code in the mobile app, and no analytics, crash-reporting or
    attribution SDK. The overlay shipped none of either; the backend has no
    telemetry at all, so a mobile SDK would be the first in the project and a
    deliberate decision to make, not an overlay default to inherit. Anything
    transmitting user data needs the AGENTS §8 argument made explicitly first.
54. `mobile/` stays out of the root workspace and the root TypeScript project,
    exactly as `admin`, `api`, `cms`, `contracts` and `infra` do. It is not an
    npm workspace member and is listed in the root `tsconfig.json` exclude, so
    root `npm ci`, `tsc --noEmit` and `next build` are unaffected by it.
55. An acceptance checklist states actual status per item, never intended
    status. It exists to be signed, and a signature asserts that testing
    happened, so an item marked done that nobody has run is a false
    attestation rather than optimism. `docs/ACCEPTANCE-CHECKLIST.md` marks
    each criterion Verified / Unverifiable / Inert / Absent / Client **on the
    item**, and carries a mechanical count. As shipped it marked ~60 items done,
    including seven for features this repository does not contain — no
    whitepaper, no architecture docs, no admin toggle UI, no investor-facing KYC
    submission, no error tracking, no alerting or on-call, no penetration test.
56. No test procedure asks for real personal data, a real wallet address or a
    real payment instrument. Synthetic data only, on every surface — the
    waitlist and investor tables hold PII under the same rules a production
    system would, and a QA walkthrough is not a reason to put a real person in
    them.
57. A CI job must never write rows into a real database. The mobile E2E
    workflow's backend-tagged flows persist a waitlist registration and an
    investor account, and a repository variable can name any host, so running
    them requires an explicit `backend_is_disposable` confirmation and fails
    loudly without it. `--exclude-tags=backend` keeps them out of a default
    run; that exclusion only works because flows 03, 05 and 06 actually carry
    the tag, which is worth re-checking whenever a flow is added.
58. A workflow that has never completed once does not fire automatically. Both
    `deploy.yml` and `mobile-e2e.yml` are `workflow_dispatch`-only. Actions has
    never run on this repository, so there is no baseline to regress from, and
    an unproven 45-minute emulator job auto-firing on every mobile pull request
    would make them red for reasons nobody has diagnosed. Re-enable automatic
    triggers per workflow, after it has passed manually.
59. Search-engine indexing is opt-in, never a default, and no origin is ever
    assumed. `SITE_INDEXABLE` must be the exact string `true` before
    `robots.txt` allows anything or `sitemap.xml` lists anything; unset means
    `Disallow: /` and `noindex, nofollow` on every page. `NEXT_PUBLIC_SITE_URL`
    has no fallback in code — the SEO overlay defaulted it to
    `https://reservechain.io`, a domain this project neither controls nor has
    deployed, which would have pointed every canonical tag, hreflang alternate
    and sitemap `<loc>` at it. A wrong canonical is worse than a missing one.
    The three `/portal` routes stay out of the index and out of the sitemap
    even on a deployment that is indexable.
60. One mechanism per rule. Page metadata is built in `src/lib/meta.ts` and
    nowhere else; the route list lives in `src/lib/routes.ts` and is held
    against the file tree by `tests/routes-parity.test.mjs`; locale checks live
    in `tests/i18n-parity.test.mjs`. Overlays #19 and #20 each shipped a second
    implementation of a rule this repository already enforced — a parallel
    `buildMetadata()` and a parallel key-parity script. Two mechanisms for one
    rule do not stay in agreement, and the half of the codebase still on the
    older one is the half nobody checks.
61. A check nobody can run is not a check. The accessibility suite needs a
    browser download and a running site, so it is a local script
    (`npm run test:a11y`) and no workflow triggers it; `npm test` stays
    dependency-free and browserless. Where a suite talks to a running site,
    the port is explicit — `docker compose` publishes the web container on
    3000, and a scan that defaults there while compose is up silently reports
    on the container image instead of the working tree. That is not
    hypothetical: it happened three times while overlay #18 was being applied.
62. A colour token carries one contrast role. `copper #C0703B` passes as text
    on the canvas (5.06:1) and fails behind white text (3.73:1), and no single
    shade satisfies both — so solid fills use `copperDeep #A85C2B` and text
    keeps `copper`. Any new token used both ways needs the same split. All
    WCAG 2.1 AA violations are fixed or explained in the change that
    introduces them; there are no suppressions in the suite today.
63. Every outbound call from a render path has a deadline. `src/lib/cms.ts`
    reads the CMS with `cache: 'no-store'` and a 5s `AbortSignal`, because a
    `try/catch` without a deadline is not graceful degradation: with the CMS
    down, `/passports` blocked for over ninety seconds before reaching its
    empty state. Next's data cache retries underneath `next: { revalidate }`
    and ignores `signal` on that path, and racing the promise instead returns
    early while the losing fetch rejects later and tears the response stream —
    a fast 200 with a truncated body. Keep the request out of that layer.
