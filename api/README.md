# ReserveChain API (P5 — Backend)

NestJS + Prisma + PostgreSQL backend for ReserveChain. Provides asset registry, Digital Asset Passport, waitlist, tokenomics, and an admin dashboard aggregate — plus a **testnet-only** chain-sync worker. Sensitive modules (Proof-of-Reserves, redemption) are present but **inactive**.

## Requirements
- Node 20+, Docker (for Postgres), and network access for `npm install`.

## Quick start
```bash
cd api
cp .env.example .env
docker compose up -d           # starts Postgres on :5432
npm install
npm run prisma:generate
npm run prisma:migrate         # creates tables (dev migration)
npm run db:seed                # seeds programs, records, a passport, waitlist, tokenomics
npm run start:dev              # API on http://localhost:4000/api
```

## Endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/api/health` | Liveness + DB check | public |
| GET | `/api/assets/programs` | List asset programs | public |
| GET | `/api/assets/programs/:code` | Program detail (e.g. `CP`, `NW`) | public |
| GET | `/api/assets/registry` | Asset registry records | public |
| GET | `/api/passports` | List Digital Asset Passports | public |
| GET | `/api/passports/:passportId` | Passport detail | public |
| GET | `/api/tokenomics` | Illustrative tokenomics | public |
| POST | `/api/waitlist` | Join waitlist (consent required) | public |
| GET | `/api/waitlist/count` | Waitlist count | admin* |
| GET | `/api/waitlist` | List entries | admin* |
| GET | `/api/dashboard/stats` | Aggregate metrics for admin dashboard | admin* |
| GET | `/api/proof-of-reserves` | **Inactive** → 501 | gated |
| POST | `/api/redemption` | **Inactive** → 501 | gated |

*Admin endpoints are unguarded in this scaffold. Add authentication + RBAC in P6/P9 before exposing them.

## Dashboard integration
`GET /api/dashboard/stats` returns totals (waitlist, programs, records, passports issued), `registrationsByType`, and `recentActivity` — designed to feed the admin dashboard UI directly.

## Chain sync (testnet only)
Disabled by default. To enable on Sepolia, set in `.env`:
```
CHAIN_SYNC_ENABLED=true
CHAIN_RPC_URL=<sepolia rpc>
CHAIN_ID=11155111
TOKEN_ADDRESS=<deployed token>
CHAIN_SYNC_START_BLOCK=<block>
```
The worker refuses to run against Ethereum mainnet (chainId 1) — both the declared `CHAIN_ID` and the live RPC network are checked.

## Compliance posture
- Testnet only; mainnet blocked in code. Mainnet/TGE requires written authorization (P20).
- Proof-of-Reserves and redemption endpoints return 501 until authorized (P11/P12).
- All tokenomics/asset figures are illustrative and clearly labeled.

## CI
A CI workflow is provided in `ci/api.yml`. **Move it to the repository root** at `.github/workflows/api.yml` (GitHub Actions only runs workflows located at the repo-root `.github/workflows/`). It runs install → prisma generate → lint → build.
