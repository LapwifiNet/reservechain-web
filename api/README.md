# ReserveChain API (P9 — Auth + RBAC + KYC + Audit Log)

NestJS + Prisma + PostgreSQL backend for ReserveChain. Provides asset registry, Digital Asset Passport, waitlist, tokenomics, KYC case management, tamper-evident audit logging, and an admin dashboard aggregate — plus a **testnet-only** chain-sync worker. Sensitive modules (Proof-of-Reserves, redemption) are present but **inactive**.

## Requirements
- Node 20+, Docker (for Postgres), and network access for `npm install`.

> Running the **whole stack** (Postgres + API + website + admin) in containers is documented
> in the root `README.md`: `docker compose up --build` from the repository root. The
> `docker-compose.yml` in this folder starts only Postgres, for the local workflow below.

## Quick start
```bash
cd api
cp .env.example .env
# IMPORTANT: Change JWT_SECRET and SERVICE_API_TOKEN in .env before any non-local deploy
docker compose up -d           # starts Postgres on :5432
npm install
npm run prisma:generate
npm run prisma:migrate         # creates tables (dev migration)
npm run db:seed                # seeds programs, records, passport, waitlist, tokenomics, admin users, KYC cases
npm run start:dev              # API on http://localhost:4000/api
```

## Authentication (P6)

The API now requires authentication for admin and compliance endpoints. Two auth methods are supported:

### 1. JWT Login (for human users)
```bash
# Login to get a token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@reservechain.local","password":"admin123"}'

# Use the token in subsequent requests
curl http://localhost:4000/api/dashboard/stats \
  -H "Authorization: Bearer <token>"
```

### 2. Service Token (for server-to-server calls)
The admin console uses a service token for authentication. Set `SERVICE_API_TOKEN` in both the API `.env` and admin console `.env`.

**Seeded admin users:**
The seed script creates three admin users with emails:
- `admin@reservechain.local` (role: admin)
- `compliance@reservechain.local` (role: compliance)
- `viewer@reservechain.local` (role: viewer)

Passwords are read from environment variables or generated randomly:
- `SEED_ADMIN_PASSWORD`: Password for admin user (optional, will generate if unset)
- `SEED_COMPLIANCE_PASSWORD`: Password for compliance user (optional, will generate if unset)
- `SEED_VIEWER_PASSWORD`: Password for viewer user (optional, will generate if unset)

If any password is not set, a random 32-character password will be generated and printed to stdout once. Admin user seeding is skipped entirely in production (`NODE_ENV=production`).

## Endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| POST | `/api/auth/login` | Login and get JWT | public |
| GET | `/api/auth/me` | Get current user | authenticated |
| GET | `/api/health` | Liveness + DB check | public |
| GET | `/api/assets/programs` | List asset programs | public |
| GET | `/api/assets/programs/:code` | Program detail (e.g. `CP`, `NW`) | public |
| GET | `/api/assets/registry` | Asset registry records | public |
| GET | `/api/passports` | List Digital Asset Passports | public |
| GET | `/api/passports/:passportId` | Passport detail | public |
| GET | `/api/tokenomics` | Illustrative tokenomics | public |
| POST | `/api/waitlist` | Join waitlist (consent required) | public |
| GET | `/api/waitlist/count` | Waitlist count | public |
| GET | `/api/waitlist` | List entries (PII) | admin, compliance |
| GET | `/api/dashboard/stats` | Aggregate metrics for admin dashboard | admin, compliance |
| GET | `/api/kyc/stats` | KYC case summary by status | admin, compliance |
| GET | `/api/kyc/cases` | List KYC cases | admin, compliance |
| GET | `/api/kyc/cases/:id` | Get KYC case by ID | admin, compliance |
| POST | `/api/kyc/cases` | Create new KYC case | admin, compliance |
| POST | `/api/kyc/cases/:id/review` | Review KYC case (status transition) | admin, compliance |
| POST | `/api/kyc/cases/:id/screen` | **Stub** sanctions screening | admin, compliance |
| GET | `/api/audit` | List audit events (paginated, filterable) | admin, compliance |
| GET | `/api/audit/verify` | Verify audit chain integrity | admin, compliance |
| GET | `/api/proof-of-reserves` | **Inactive** → 501 | gated |
| POST | `/api/redemption` | **Inactive** → 501 | gated |

**Role definitions:**
- `admin`: Full access to all admin/compliance endpoints
- `compliance`: Access to waitlist, dashboard stats, and all KYC endpoints
- `viewer`: Can authenticate but cannot access admin/compliance endpoints

## Rate limiting

`ThrottlerGuard` is registered globally (`APP_GUARD` in `app.module.ts`), so every route is rate
limited by default.

| Scope | Limit | Notes |
|---|---|---|
| Global default | 100 requests / 60s per IP | Baseline for general API traffic |
| `POST /api/auth/login` | 5 requests / 60s per IP | Dedicated `@Throttle` to slow credential stuffing |
| `GET /api/health` | exempt | `@SkipThrottle` so liveness probes are never blocked |

Exceeding a limit returns HTTP `429 Too Many Requests`. Enforcement is covered by
`test/rate-limit.e2e-spec.ts`.

## Dashboard integration
`GET /api/dashboard/stats` returns totals (waitlist, programs, records, passports issued), `registrationsByType`, and `recentActivity` — designed to feed the admin dashboard UI directly. Requires admin or compliance role.

## KYC Case Management (P6)

The KYC module provides internal compliance surface for managing KYC/KYB cases. All endpoints require authentication and admin/compliance roles.

**Screening stub:** `POST /api/kyc/cases/:id/screen` returns a deterministic stub response marked as "Illustrative". Live sanctions/PEP/adverse-media screening is **inactive** pending written authorization and provider contracts.

## Audit Log (P9)

The audit module provides tamper-evident logging of all mutating requests on role-guarded routes. All audit events are append-only with chain-based integrity verification.

**Features:**
- Automatic recording of POST, PATCH, PUT, DELETE requests on role-guarded routes
- Tamper-evident chain using SHA-256 hashing over canonical serialization
- PII protection: passwords, tokens, document contents, and email addresses are redacted
- Paginated listing with filters (actor, action, resourceType, date range)
- Chain verification endpoint to detect tampering

**Append-only enforcement:** No update or delete routes exist for audit records. This is a hard requirement for compliance.

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
- KYC screening is a stub; live provider integration is inactive pending authorization.
- Personal data (waitlist, KYC) is PII and requires role-based access control.
- Audit log is append-only with tamper-evident chain verification; no update/delete routes exist.

## Environment Variables

Required for P6 authentication:
- `JWT_SECRET`: Secret key for admin/staff JWT signing (change in production)
- `JWT_EXPIRES_IN`: Token expiration time (default: 12h; also used for investor tokens)
- `SERVICE_API_TOKEN`: Service token for server-to-server authentication (admin console).
  Read-only: state-changing requests with it are refused with 403.

Required for P8 (investor portal):
- `INVESTOR_JWT_SECRET`: Secret key for investor-portal JWT signing. Must be at least
  32 characters and must differ from `JWT_SECRET` — investor and staff tokens are
  disjoint domains (`typ: 'investor'` vs `typ: 'admin'`) signed with different keys,
  and the API refuses to start otherwise.

## CI
The unified CI pipeline is at `.github/workflows/ci.yml` in the repository root. It runs install → prisma generate → lint → build → e2e tests for all packages.
