-- ReserveChain waitlist table.
-- Auto-created by src/lib/store.ts on first write; provided here for reference
-- or manual provisioning (psql -f src/db/schema.sql "$DATABASE_URL").
CREATE TABLE IF NOT EXISTS waitlist (
  id           text PRIMARY KEY,
  email        text NOT NULL,
  name         text,
  organization text,
  interest     text,
  locale       text NOT NULL DEFAULT 'en',
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON waitlist (created_at DESC);
