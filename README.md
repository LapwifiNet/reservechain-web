# OpenRWA

**Open-source reference implementation for tokenizing real-world industrial assets.**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

OpenRWA is a full-stack template for an asset-backed token platform: a public
website, a headless CMS, an admin console, a REST API, an ERC-20 contract suite
and a mobile app, wired together, containerised, and shipped with the compliance
guardrails this class of product needs from day one.

It ships **inert**. No token exists, nothing is deployed, and every module that
could resemble an offer is disabled in code. Enabling any of them is an explicit
decision taken by whoever operates a deployment, under their own legal advice.

## Why this exists

Most "tokenize a real asset" projects rebuild the same scaffolding: a
multi-locale marketing site, an evidence model for the underlying asset, KYC and
audit trails, a token contract, an admin console, and some way to keep all of it
switched off until the paperwork is real. OpenRWA is that scaffolding, extracted
and de-branded so it can be forked.

## What is in the box

| Component | Stack | Path | Port |
| --- | --- | --- | --- |
| Website | Next.js 14 App Router, TypeScript, Tailwind, next-intl (EN/ES/IT) | `src/` | 3000 |
| API | NestJS, Prisma, PostgreSQL | `api/` | 4000 |
| Admin console | Next.js 14 | `admin/` | 4100 |
| CMS | Payload | `cms/` | 3001 |
| Contracts | Solidity, Foundry, OpenZeppelin, Safe | `contracts/` | n/a |
| Mobile | React Native / Expo, Maestro E2E | `mobile/` | n/a |
| Infrastructure | Docker Compose, Terraform, GitHub Actions | `infra/`, `.github/` | n/a |

## Quick start

```bash
git clone https://github.com/LapwifiNet/openrwa.git
cd openrwa
cp .env.docker.example .env
# then generate four DIFFERENT 32-character secrets, see Configuration below
docker compose up --build
```

| Service | URL |
| --- | --- |
| Website | http://localhost:3000 |
| API health | http://localhost:4000/api/health |
| Admin console | http://localhost:4100 |
| CMS admin | http://localhost:3001/admin |

Postgres listens on 5432. The CMS gets its own database on 5433
(`CMS_POSTGRES_PORT`). Default database and user names are `openrwa` and
`openrwa_cms`.

To load demo content, set `RUN_DB_SEED=true` on the first run. The seed creates
placeholder accounts and illustrative asset programs. It is not intended for any
public deployment.

## Configuration

Four secrets are mandatory. Each must be at least 32 characters, and all four
must differ from each other:

| Variable | Used by |
| --- | --- |
| `JWT_SECRET` | admin and staff sessions |
| `INVESTOR_JWT_SECRET` | participant sessions |
| `SERVICE_API_TOKEN` | service-to-service calls |
| `PAYLOAD_SECRET` | CMS |

The stack refuses to boot if any of them is missing, too short, or reused.
`WAITLIST_API_BASE` is server-side only and must never reach the browser.

## Safety model

Five feature flags default to `false`:

`PROOF_OF_RESERVES_ENABLED`, `REDEMPTION_ENABLED`, `WALLET_ENABLED`,
`PURCHASE_ENABLED`, `CHAIN_SYNC_ENABLED`

When a flag is off, `FeatureFlagGuard` returns HTTP `501` *before*
authentication is evaluated, so a disabled module leaks nothing, not even
whether a credential was valid. When a flag is on, the underlying service
methods still refuse with `501` until they are deliberately implemented for a
real deployment. Enabling a flag moves the refusal; it does not turn on a
workflow.

The token status scale stops at `testnet-deployed`. No admin edit, CMS field or
API call can express a live offering.

Every locale carries a default disclosure stating that the deployment offers
nothing. Operators may extend it. Removing it is not supported.

## Screen registry

`docs/spec/screens.yaml` tracks 84 screen ids and their implementation state.
`docs/spec/decisions.yaml` records design decisions D1 to D6. CI runs:

```bash
npm run verify:screens
```

which fails the build if a screen is implemented without a registry entry, or a
registry entry contradicts the code.

## Testing

```bash
npm test                                 # website unit tests
npm run test:a11y                        # Playwright + axe, WCAG 2.1 AA
cd api && npm test                       # NestJS e2e suite
cd contracts && forge test               # Foundry
cd mobile && npx maestro test .maestro   # mobile E2E
```

The API suite runs with `maxWorkers: 1` on purpose: the e2e tests share one
database and the audit hash chain is order-sensitive.

## Documentation

| Document | Contents |
| --- | --- |
| `docs/USER-MANUAL.md` | End-user walkthrough |
| `docs/ADMIN-MANUAL.md` | Admin console and CMS |
| `docs/RUNBOOK.md` | Operations, backup, restore, incident response |
| `docs/TRAINING.md` | Onboarding material for operators |
| `docs/ACCEPTANCE-CHECKLIST.md` | Release acceptance criteria |
| `SECURITY.md` | Reporting, supported versions, known issues |
| `TRADEMARKS.md` | Name and brand policy for forks |

## Status

Pre-1.0. The website, CMS, admin console, API, auth and KYC, audit log,
contracts on testnet, the mobile shell and CI are implemented. Mainnet
deployment, an independent audit, and the gated modules are deliberately not
done.

Read `SECURITY.md` for the current known-issues list before running this
anywhere that matters.

## Contributing

Read `CONTRIBUTING.md`. Issues and pull requests are welcome, including on the
open design questions listed there.

## License

Apache License 2.0. See `LICENSE` and `NOTICE`.

Copyright 2026 Tin Ly.

The name **OpenRWA** and the token symbol **ORWA** are covered by
`TRADEMARKS.md`. The code is yours to fork; the name is not.

## Disclaimer

OpenRWA is software, not financial, legal or tax advice. It does not offer,
sell or solicit any token, security or financial product, and running it does
not make anything compliant. Whoever deploys it is solely responsible for their
own legal structure, offering documentation, asset verification, jurisdictional
eligibility, KYC/KYB, sanctions screening and approvals. All asset data in this
repository is illustrative placeholder content.
