# OpenRWA CMS — Registry + Digital Asset Passports (Payload v2)

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
createdb openrwa_cms     # separate DB from the NestJS API
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

## Runtime facts you will otherwise rediscover the hard way

**Payload does not auto-push the schema under `NODE_ENV=production`.** It pushes
only in development. In production it neither pushes nor migrates, so a
container with no migrations boots perfectly happily — `/health` returns 200 and
`/admin` renders — and then returns **500 on every request that touches the
database**, because no tables exist. Committed migrations plus the migrate step
in `docker-entrypoint.sh` are therefore mandatory, not a convenience.

The corollary: a health probe proves nothing here. The check that actually
proves the CMS works is a real data request, e.g.

```bash
curl -s -w '%{http_code}\n' 'http://localhost:3001/api/passports?limit=1'
```

To add a migration after changing a collection:

```bash
npm run migrate:create -- <name>    # writes src/migrations/<timestamp>_<name>.ts
```

Generated migrations import `sql` from `drizzle-orm`, which is **not** a direct
dependency and cannot become one: it carries an optional peer on
`@op-engineering/op-sqlite`, which pulls `react-native` and forces React 19
against Payload's React 18, and npm refuses to resolve. Rewrite the generated
call to use the adapter's own pool instead — `payload.db.pool.query(...)`, which
needs no import. The committed migration shows the shape.

**`seed:prod` exists because the runtime image ships `dist/` only.** The `seed`
script runs through ts-node against `src/`, which is absent from the container,
so it fails with `Cannot find module './seed.ts'`. The entrypoint calls
`seed:prod` (compiled, `dist/seed/seed.js`) when `RUN_CMS_SEED=true`. Seeding is
opt-in and never creates users in production either way.

**The dependency pins are load-bearing.** `@payloadcms/db-postgres` 0.8.x
requires a `drizzle-kit` prerelease that has been unpublished from the registry,
so it is held at `^0.8.10` with an npm `overrides` entry pinning `drizzle-kit`
to the published `0.23.2`. Removing either makes `npm install` fail outright.
`.github/dependabot.yml` ignores major bumps for this directory for that reason.

## Notes

- The CMS uses its **own** database/schema (`openrwa_cms`) so Payload-managed
  tables never collide with the NestJS API's Prisma tables.
- `npm run generate:types` regenerates `src/payload-types.ts` from the config.
- CORS/CSRF origins are read from `CORS_ORIGINS` (website + admin console).
- File uploads are written to `cms/uploads/` (git-ignored in a real repo).
