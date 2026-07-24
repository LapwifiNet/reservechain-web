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
- Add Payload CMS for content, NestJS for the shared API, and the ERC-20 suite (Foundry)
  per the full 22-phase build plan.

## Database (production waitlist)

The waitlist store auto-selects a backend at runtime:
- **No `DATABASE_URL`** → local JSON file (`data/waitlist.json`), development only.
- **`DATABASE_URL` set** → PostgreSQL (Vercel Postgres, Neon, Supabase, ...). The `waitlist` table is created automatically on first write; see `src/db/schema.sql`.

On Vercel, add `DATABASE_URL` under Project → Settings → Environment Variables, then redeploy. The JSON file store does **not** persist on Vercel (ephemeral filesystem), so a database is required for a working hosted waitlist.
