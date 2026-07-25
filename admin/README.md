# ReserveChain \u2014 Admin Console

Operational admin/CMS console for the ReserveChain industrial-metals RWA platform.
Built with **Next.js 14 (App Router) + TypeScript + Tailwind**, dark-first institutional theme.

It reads **live data** from the backend API (`/api/*`) \u2014 no mock data. Point it at a running
backend and the dashboard shows real totals, registrations, registry, passports and tokenomics.

## Sections

| Section | Route | Source endpoint | State |
| --- | --- | --- | --- |
| Overview | `/` | `GET /api/dashboard/stats` | live |
| Asset Registry | `/registry` | `GET /api/assets/registry` | live |
| Programs | `/programs` | `GET /api/assets/programs` | live |
| Digital Passports | `/passports` | `GET /api/passports` | live |
| Waitlist | `/waitlist` | `GET /api/waitlist` | live |
| Tokenomics | `/tokenomics` | `GET /api/tokenomics` | live |
| Reserve Reports | `/reserves` | `GET /api/proof-of-reserves` | **inactive (501)** |
| KYC / KYB | `/kyc` | `GET /api/kyc/cases`, `GET /api/kyc/stats` | **guarded**\* |
| Redemption | `/redemption` | `POST /api/redemption` | **inactive (501)** |
| Audit Log | `/audit` | `GET /api/audit` | live |

\* The KYC/KYB backend (`KycModule`) is fully implemented and role-guarded (JWT + ADMIN/COMPLIANCE);
case creation, review and stats are live. The `/kyc` admin page still renders a placeholder pending
UI wiring to those endpoints. Sanctions/PEP screening (`POST /api/kyc/cases/:id/screen`) remains an
illustrative stub pending provider authorization.

## Run locally

```bash
# 1) Start the API backend first (see api/README.md) so it serves on http://127.0.0.1:4000/api

# 2) Then the admin console:
cd admin
cp .env.example .env        # set API_BASE_URL if the backend is elsewhere
npm install
npm run dev                 # http://localhost:4100
```

`npm run build` produces a production build; `npm start` serves it on port 4100.

## Configuration

| Env var | Default | Notes |
| --- | --- | --- |
| `API_BASE_URL` | `http://127.0.0.1:4000/api` | Server-side only. Use the docker service name (e.g. `http://api:4000/api`) when both run in the same compose network. |

All data fetching happens in server components with `cache: 'no-store'`, so the dashboard always
reflects the current backend state. If the backend is unreachable, each page renders a clear
banner and an empty state instead of crashing.

## Compliance

- Testnet demo only. All asset purities, tokenomics and passport figures are **illustrative**.
- Proof-of-Reserves (P11) and Redemption (P12) are intentionally **inactive** (HTTP 501) and gated
  behind future phases plus written authorization.
- KYC/KYB (P6) and the Audit Log (P9) are implemented and role-guarded (JWT + ADMIN/COMPLIANCE), not
  gated; KYC/KYB sanctions screening is an illustrative stub pending provider authorization.
- Admin endpoints require authentication via JWT or service token (P6 auth + RBAC).

## CI

The admin console is built and type-checked by the unified CI pipeline at `.github/workflows/ci.yml`.
