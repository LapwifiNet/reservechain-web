# ReserveChain CMS — Registry + Digital Asset Passports (Payload v2)

A headless CMS that owns the **asset registry** (programs, physical records,
certificates) and publishes **Digital Asset Passports (DAP)** for the public
website. Built on Payload v2 + PostgreSQL, served by Express on port `3001`.

> Testnet only. All seeded values are **illustrative**. The on-chain token
> mapping on each passport is admin-gated and inactive by default.

## Collections

| Collection | Group | Purpose | Public read |
| --- | --- | --- | --- |
| `users` | Administration | Auth + roles (`admin` / `editor` / `viewer`) | No |
| `media` | Registry | Uploads — Certificates of Analysis, imagery | Yes |
| `asset-programs` | Registry | Tokenizable metal programs (Copper, Nickel) | Published only |
| `asset-records` | Registry | Physical lots + CoA + custody (internal) | No (staff only) |
| `passports` | Registry | Public Digital Asset Passports | Published only |

## Access model

- **admin** — full control, manages users, deletes, and the token mapping field.
- **editor** — creates/updates registry content and passports.
- **viewer** — read-only staff.
- **anonymous** — sees only `published` programs and passports (never records).

Role changes are locked to admins at the field level to prevent privilege
escalation. The verbatim pre-launch disclosure is the default value on every
program and passport.

## Public passport endpoint

Beyond the standard REST/GraphQL API, a sanitised read-only DAP is exposed:

```
GET /api/passports/public/:slug
```

Returns program identity, purity, highlights, and the disclosure. It returns the
token mapping **only** when an admin has explicitly activated it; otherwise
`tokenMapping` is `null`. The public website consumes this endpoint to render
passport pages.

## Setup

```bash
cd cms
cp .env.example .env          # set DATABASE_URI + PAYLOAD_SECRET
createdb reservechain_cms     # separate DB from the NestJS API
npm install
npm run seed                  # admin user + Copper/Nickel programs & passports
npm run dev                   # admin at http://localhost:3001/admin
```

`PAYLOAD_SECRET` is required, must be at least 32 characters, and **must differ
from the API's `JWT_SECRET` and `INVESTOR_JWT_SECRET`** — the CMS is a third,
disjoint token domain, and the service refuses to start otherwise. Generate one
with `openssl rand -hex 32`.

The seed ships **no** credential. It reads `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`; when the password is unset it generates a random one and
prints it once. It skips user seeding entirely when `NODE_ENV=production`.

In Docker the CMS runs against its own `postgres-cms` service (host port 5433),
never the API's database:

```bash
docker compose up cms        # http://localhost:3001/admin
```

### Production build

```bash
npm run build     # bundles the admin panel + compiles the server
npm run serve     # NODE_ENV=production node dist/server.js
```

## Notes

- The CMS uses its **own** database/schema (`reservechain_cms`) so Payload-managed
  tables never collide with the NestJS API's Prisma tables.
- `npm run generate:types` regenerates `src/payload-types.ts` from the config.
- CORS/CSRF origins are read from `CORS_ORIGINS` (website + admin console).
- File uploads are written to `cms/uploads/` (git-ignored in a real repo).
