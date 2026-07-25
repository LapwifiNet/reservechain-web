# ReserveChain

![CI](https://github.com/LapwifiNet/reservechain-web/actions/workflows/ci.yml/badge.svg)

Hosted working draft covering contest deliverables **P1–P2**: public website + verbatim
prelaunch disclosure + Copper Powder / Nickel Wire program pages + a sample Digital Asset
Passport + a working multi-step waitlist saved to a data store. Built dark-first,
institutional, responsive, and internationalized (EN / ES / IT).

## Stack
- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **next-intl** for EN/ES/IT routing and messages
- Waitlist API route with a JSON file store (swap for PostgreSQL in production)

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
src/
  app/[locale]/            # localized pages: home, copper-powder, nickel-wire, passport/[id], waitlist
  app/api/waitlist/        # POST endpoint that stores registrations
  components/              # Nav, Footer, Disclosure, Button, StatusTag, SpecTable
  i18n/                    # next-intl routing + request config
  messages/               # en.json, es.json, it.json
  styles/globals.css       # design tokens
```

## Compliance (kept throughout)
- Only clearly labeled **illustrative** data — never fabricated.
- Verbatim prelaunch disclosure shown in the footer and on the waitlist.
- Sensitive modules (Proof-of-Reserves, redemption, wallet, purchase) are **not** part of
  this public draft and remain inactive until authorized.

## Production notes
- Replace `src/lib/store.ts` (JSON file) with PostgreSQL + an append-only audit table.
- The shared API (`api/`, NestJS) and the ERC-20 suite (`contracts/`, Foundry) are already part of
  this monorepo. Payload CMS for content is still **not created yet** (P10) per the full 22-phase
  build plan.

## Database (production waitlist)

The waitlist store auto-selects a backend at runtime:
- **No `DATABASE_URL`** → local JSON file (`data/waitlist.json`), development only.
- **`DATABASE_URL` set** → PostgreSQL (Vercel Postgres, Neon, Supabase, ...). The `waitlist` table is created automatically on first write; see `src/db/schema.sql`.

On Vercel, add `DATABASE_URL` under Project → Settings → Environment Variables, then redeploy. The JSON file store does **not** persist on Vercel (ephemeral filesystem), so a database is required for a working hosted waitlist.
