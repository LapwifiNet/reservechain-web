# ReserveChain

![CI](https://github.com/LapwifiNet/reservechain-web/actions/workflows/ci.yml/badge.svg)

Working draft of the ReserveChain platform, an institutional RWA tokenization project for
industrial metals (Copper Powder, Nickel Wire). It is **pre-launch** — nothing is offered or
sold. The repository is a four-workspace monorepo: the public website, a REST API, an
internal admin console, and the ERC-20 contract suite. The website carries the verbatim
prelaunch disclosure, the Copper Powder / Nickel Wire program pages, a sample Digital Asset
Passport and a multi-step waitlist; it is dark-first, institutional, responsive and
internationalized (EN / ES / IT). Development follows a 22-phase plan (P1–P22).

## Stack
- **Website** (`/`, `src/`) — Next.js 14 (App Router) + TypeScript + Tailwind CSS, with
  **next-intl** for EN/ES/IT routing and messages, and a waitlist API route backed by a JSON
  file store in development or PostgreSQL when `DATABASE_URL` is set
- **API** (`api/`) — NestJS 10 + Prisma + PostgreSQL; shared backend for the website, the
  admin console and a future mobile client
- **Admin console** (`admin/`) — Next.js 14, internal-only, reads the API server-side
- **Contracts** (`contracts/`) — Solidity + Foundry + OpenZeppelin v5; **testnet only**
  (Sepolia)

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
# open http://localhost:3000  (redirects to /en)
```

## Run the whole stack in Docker

Brings up PostgreSQL, the API, the website and the admin console together. The API applies
its Prisma migrations on start, so the database is ready without a manual step.

```bash
cp .env.docker.example .env          # then set JWT_SECRET and SERVICE_API_TOKEN
openssl rand -hex 32                 # generate a value for each
docker compose up --build
```

| Service | URL | Notes |
| --- | --- | --- |
| Website | http://localhost:3000 | redirects to `/en` |
| API | http://localhost:4000/api | `/api/health` reports database status |
| Admin console | http://localhost:4100 | reads the API server-side |
| PostgreSQL | `localhost:5432` | user/db `reservechain` |

`.env` is gitignored — `JWT_SECRET` and `SERVICE_API_TOKEN` must each be at least 32
characters or the API refuses to start. The admin console authenticates to the API with
`SERVICE_API_TOKEN`, so both services read the same value.

**Development with hot reload** — bind-mounts the working tree and runs `next dev` /
`nest start --watch`, so edits on the host reload inside the containers:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**Seed admin users** (local only): set `RUN_DB_SEED=true` in `.env` before starting.

**Foundry toolchain** — a one-off container, not part of the running stack:

```bash
docker compose run --rm contracts "forge build --sizes"
docker compose run --rm contracts "forge test -vvv"
```

## Structure
```
src/                       # public website (Next.js App Router)
  app/[locale]/            # localized pages: home, copper-powder, nickel-wire, passport/[id], waitlist
  app/api/waitlist/        # POST endpoint that stores registrations
  components/              # Nav, Footer, Disclosure, Button, StatusTag, SpecTable
  i18n/                    # next-intl routing + request config
  messages/               # en.json, es.json, it.json
  styles/globals.css       # design tokens

api/                       # NestJS + Prisma REST API for web, admin and future mobile
  src/                     # one folder per module (health, assets, passports, waitlist,
                           #   tokenomics, dashboard, auth, kyc, audit, chain-sync, sensitive)
  prisma/                  # schema.prisma, migrations and seed script

admin/                     # internal admin console (Next.js), reads the API server-side
  src/app/                 # overview, registry, programs, passports, waitlist, tokenomics,
                           #   kyc, audit, plus gated reserves and redemption pages
  src/components/          # PageHeader, DataTable, Badge, StatCard, EmptyState, Sidebar

contracts/                 # Solidity + Foundry ERC-20 suite (testnet only)
  src/                     # token contract
  script/                  # deploy and role-assignment scripts
  test/                    # Foundry tests

infra/wallets/             # Gnosis Safe setup docs, role matrix, wallet inventory templates
```

Payload CMS (`cms/`, P10), the React Native app (`mobile/`, P13) and the Terraform
infrastructure (`infra/` Terraform, P19) are **not created yet**.

## Compliance (kept throughout)
- Only clearly labeled **illustrative** data — never fabricated.
- Verbatim prelaunch disclosure shown in the footer and on the waitlist.
- Proof-of-Reserves (P11) and Redemption (P12) are built as surfaces only: the API returns
  HTTP `501` and the admin console renders a gated notice. They stay inactive pending
  written authorization. KYC / KYB (P6) and the append-only Audit log (P9) are implemented
  and role-guarded, readable only by an authenticated ADMIN or COMPLIANCE user.

## Waitlist storage

The API owns waitlist registrations. The website's `src/app/api/waitlist/route.ts`
validates the submission and proxies it to `POST {WAITLIST_API_BASE}/waitlist`, so the
site and the admin console read and write the same rows — a signup on the public site
appears immediately on the admin **Waitlist** page.

Set `WAITLIST_API_BASE` (server-side only; never `NEXT_PUBLIC_*`) to the API base URL:
`http://127.0.0.1:4000/api` locally, `http://api:4000/api` under Docker Compose, and the
deployed API host on Vercel — add it under Project → Settings → Environment Variables,
then redeploy. No credential is sent with the request: `POST /waitlist` is public by
design and the website holds no service token.

The website no longer uses `DATABASE_URL` or `PGSSL`; its own JSON/Postgres store has
been removed. Re-submitting an address returns the existing registration id rather than
an error, so the form stays idempotent.
