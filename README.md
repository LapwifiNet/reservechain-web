# ReserveChain

> **Contest submission — not a live product.** This repository is a contest entry. It was
> submitted, it was **not selected**, there is no client engagement or contract behind it,
> and nothing here runs in production or is operated as a service.
>
> - **Testnet only.** The contract suite targets the **Sepolia** testnet. There is no
>   mainnet deployment and no mainnet contract address exists.
> - **No tokens are being offered or sold.** Nothing in this repository is an offer, a
>   solicitation of an offer, investment advice, or a prospectus.
> - **The data is illustrative.** Every quantity, purity, valuation, certificate,
>   custodian, insurer and tokenomics figure here is an illustrative placeholder. None of
>   it is real data about real metal, real reserves or real counterparties.
> - **The wallet, purchase, proof-of-reserves and redemption modules are built but
>   disabled.** They publish route shapes only and return HTTP `501`. Enabling them
>   requires a finalized legal structure, an independent smart-contract audit, a
>   penetration test, and written authorization.
> - **Not audited, not penetration-tested.** Do not deploy this to mainnet and do not use
>   it to custody real assets or real funds.
> - Provided **as-is** under [LICENSE](LICENSE), without warranty of any kind. Known
>   issues and gaps are recorded in [SECURITY.md](SECURITY.md).

![CI](https://github.com/LapwifiNet/reservechain-web/actions/workflows/ci.yml/badge.svg)

What was built for the submission: a working draft of the ReserveChain platform, an
institutional RWA tokenization project for industrial metals (Copper Powder, Nickel Wire).
It is **pre-launch** — nothing is offered or sold. The repository is a monorepo of five
workspaces: the public website, a REST API, an internal admin console, the ERC-20 contract
suite and a Payload CMS. The website was built to carry the verbatim prelaunch disclosure,
the Copper Powder / Nickel Wire program pages, a sample Digital Asset Passport and a
multi-step waitlist; it was designed dark-first, institutional, responsive and
internationalized (EN / ES / IT). It was built against a 22-phase plan (P1–P22), which was
the plan for the submission rather than a delivery schedule now in progress.

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
cp .env.docker.example .env          # set JWT_SECRET, SERVICE_API_TOKEN, INVESTOR_JWT_SECRET, PAYLOAD_SECRET
openssl rand -hex 32                 # generate a value for each
docker compose up --build
```

| Service | URL | Notes |
| --- | --- | --- |
| Website | http://localhost:3000 | redirects to `/en` |
| API | http://localhost:4000/api | `/api/health` reports database status |
| Admin console | http://localhost:4100 | reads the API server-side |
| CMS | http://localhost:3001/admin | Payload; asset registry + public passports |
| PostgreSQL | `localhost:5432` | user/db `reservechain` |
| PostgreSQL (CMS) | `localhost:5433` | user `reservechain`, db `reservechain_cms` |

`.env` is gitignored — `JWT_SECRET`, `SERVICE_API_TOKEN`, `INVESTOR_JWT_SECRET` and
`PAYLOAD_SECRET` must each be at least 32 characters or the services refuse to start.
The three signing keys must all differ from one another: staff, investor and CMS
sessions are deliberately disjoint token domains, so a token from one is not merely
unauthorised in another — it fails signature verification. The CMS also runs against
its own database and never touches the API's. The admin console authenticates to the
API with `SERVICE_API_TOKEN`, so
both services read the same value.

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

cms/                       # Payload v2 CMS on Express; own database, port 3001
  src/collections/         # AssetPrograms, AssetRecords, Passports, Media, Users
  src/access/              # role-based access rules
  src/migrations/          # Payload schema migrations
  src/seed/                # seed script (random admin password unless SEED_ADMIN_PASSWORD)

infra/wallets/             # Gnosis Safe setup docs, role matrix, wallet inventory templates
mobile/                    # Expo app (iOS + Android); standalone, not an npm workspace
docs/                      # RUNBOOK, USER-MANUAL, ADMIN-MANUAL, TRAINING
                           #   (operations + onboarding; not the specification)
infra/terraform/           # AWS IaC (VPC, ALB, ECS Fargate, RDS, S3/CloudFront, ECR,
                           #   Secrets Manager). Validated, never applied
```

The React Native app (`mobile/`, P13) exists — Expo SDK 51, iOS + Android, investor domain
only — and has been verified with lint and `tsc --noEmit`; it has **never been run on a
device or built into a binary**, and none of its six Maestro flows has been executed. `docs/` holds the operations
runbook, the user and admin manuals and the training guide; the full specification (brief,
PRD, wireframes, roadmap) stays in Notion (P21); only the screen registry + decision log
(`docs/spec/`, one-way mirror from Notion, CI-gated by `npm run verify:screens`) are in-repo. Payload CMS (`cms/`, P10) exists — see the entry above and the
Docker service table. The Terraform infrastructure (`infra/terraform/`, P19) exists and is
verified with `terraform validate` and `fmt -check`; it has never been applied, and no AWS
resource exists as a result of anything in this repository.

## Compliance (kept throughout)
- Only clearly labeled **illustrative** data — never fabricated.
- Verbatim prelaunch disclosure shown in the footer and on the waitlist.
- Four modules are built as surfaces only — Proof-of-Reserves (P11), Redemption (P12),
  wallet linking and token purchase: the API returns HTTP `501` for all four, and the admin
  console renders a gated notice on its `/reserves` and `/redemption` pages (wallet and
  purchase have no console page). Each is gated twice. `FeatureFlagGuard` refuses with `501`
  before authentication is considered when the module's flag
  (`PROOF_OF_RESERVES_ENABLED`, `REDEMPTION_ENABLED`, `WALLET_ENABLED`,
  `PURCHASE_ENABLED`, all default `false`) is off, and with the flag on every service
  method still refuses with `501` — so enabling a flag moves the refusal rather than
  activating a workflow. They stay inactive pending written authorization. KYC / KYB (P6)
  and the append-only Audit log (P9) are implemented and role-guarded, readable only by an
  authenticated ADMIN or COMPLIANCE user.

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

## Intellectual property

Intellectual property in this submission is offered to the contest issuer under the terms
of the contest brief.

## Ownership, licensing & trademarks

Three separate layers, with different holders and different terms:

| Layer | Holder | Terms |
| --- | --- | --- |
| The code in this repository | Tin Ly | Licensed under Apache License 2.0 ([LICENSE](LICENSE)). Licensed, never assigned. |
| The "ReserveChain" name, logo, visual identity and the `reservechain.io` domain | The prospective client | **Not licensed by this repository.** Apache 2.0 section 6 grants no trademark rights. See [TRADEMARKS.md](TRADEMARKS.md). |
| The specification and brief | The prospective client | The authoritative specification lives in Notion. The repository carries only a read-only, one-way mirror of the screen registry + decision log (`docs/spec/`), which is CI-gated; it is not a substitute for the spec. |

The code published here is licensed under Apache License 2.0. That grant is perpetual and
irrevocable for anyone who has already obtained a copy, and a later transfer of repository
ownership does not revoke it.

The Solidity sources under `contracts/` carry the same `Apache-2.0` SPDX identifier. Those
four files were previously published with an `MIT` SPDX header, so anyone who obtained a
copy before that change retains the MIT grant for those files.

Two outcomes remain open. If the submission is selected, the work is handed over to the
client under this licence. If it is not, the code continues as a de-branded, generic
real-world-asset tokenization platform under a different name.

Anyone redistributing or deploying this code must rename the project and remove the brand
references first — see [TRADEMARKS.md](TRADEMARKS.md) for what that involves. Security
status, known issues and how to report a vulnerability are in [SECURITY.md](SECURITY.md).
