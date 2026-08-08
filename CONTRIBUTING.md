# Contributing to OpenRWA

Thanks for taking the time to contribute. OpenRWA is open-source reference software for
asset-backed tokenization, released under Apache-2.0.

Read `SECURITY.md` before reporting anything that touches a vulnerability, and read
`TRADEMARKS.md` before forking under a different name.

## Ground rules

OpenRWA is pre-1.0 and has never been audited. Two rules keep it honest:

1. **Testnet only.** Deploy targets are Sepolia. Do not add mainnet RPC URLs, mainnet chain
   IDs, or mainnet deploy steps. Going to mainnet is a decision for whoever operates a
   deployment, taken after an independent audit — never a change made in this repository.
2. **Sensitive modules ship off.** `PROOF_OF_RESERVES_ENABLED`, `REDEMPTION_ENABLED`,
   `WALLET_ENABLED`, `PURCHASE_ENABLED` and `CHAIN_SYNC_ENABLED` default to `false` and are
   enforced by `FeatureFlagGuard`, which returns `501` before authentication runs. A pull
   request that flips a default, weakens the guard, or routes around it will be closed.

The project operates no deployment, offers or sells no token, and provides no legal advice.
Please do not open issues asking for any of those.

## Getting set up

Prerequisites: Node 20, npm, Git, Docker, PostgreSQL 16, and Foundry for the contracts.

```bash
git clone https://github.com/LapwifiNet/openrwa.git
cd openrwa
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

| Component | Directory | Port |
| --- | --- | --- |
| Website | `src/` | 3000 |
| API | `api/` | 4000 |
| Admin console | `admin/` | 4100 |
| CMS | `cms/` | 3001 |
| Contracts | `contracts/` | — |
| Mobile | `mobile/` | — |
| Infrastructure | `infra/` | — |

There are no default credentials. The seed script reads `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD`, `SEED_COMPLIANCE_EMAIL`, `SEED_COMPLIANCE_PASSWORD`,
`SEED_INVESTOR_EMAIL`, `SEED_INVESTOR_PASSWORD`, `CMS_SEED_EMAIL` and `CMS_SEED_PASSWORD`,
and refuses to run if they are unset. Generate them with `openssl rand -base64 24`.

## Before you open a pull request

```bash
npm run lint
npm run typecheck
npm test
npm run verify:screens
cd contracts && forge test
```

`npm run verify:screens` checks the code against `docs/spec/screens.yaml`. If you add or
rename a screen, update that file in the same commit.

## Branch and commit conventions

Branches: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`, `chore/<short-name>`.

Commits follow Conventional Commits, for example `feat(api): add participant status endpoint`.
Scopes in use: `web`, `api`, `admin`, `cms`, `contracts`, `mobile`, `infra`, `docs`, `ci`.

## Pull requests

Keep them focused — one concern per pull request. Fill in the template, describe how you
tested the change, and say explicitly if it touches authentication, RBAC, the audit trail, the
feature flags, or the contracts. Those areas get a closer review.

Never commit `.env` files, private keys, seed phrases, real personal data, or anything taken
from a production system.

## Reporting bugs and requesting features

Use the issue templates. For anything security-sensitive, do not open a public issue — follow
`SECURITY.md` instead.

## Licence

By contributing you agree that your contribution is licensed under Apache-2.0, the same
licence as the project.
