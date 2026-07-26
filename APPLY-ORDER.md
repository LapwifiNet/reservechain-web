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
| 6 | reservechain-cms.zip | `cms/` | `cms/` | Payload, separate DB `reservechain_cms`, port 3001 |
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
