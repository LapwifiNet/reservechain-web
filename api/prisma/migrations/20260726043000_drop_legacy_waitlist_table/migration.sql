-- Drop the legacy site-store "waitlist" table.
--
-- This table was created outside Prisma by src/db/schema.sql, back when the
-- public website owned its own waitlist store. The waitlist-wire overlay
-- (a5d4e66) removed that store — the API's "WaitlistEntry" model is the single
-- source of truth — but deleting schema.sql left the table itself behind in
-- databases that had run it. No Prisma model references it (there is no @@map
-- in schema.prisma; the model's table is "WaitlistEntry").
--
-- `prisma migrate diff` flagged it as a stray DROP during the investor_portal
-- migration, where it was deliberately excluded: a table drop belongs in its
-- own reviewed migration, not in the side effects of a generated diff.
--
-- IF EXISTS because fresh databases never had the table — it only exists where
-- the pre-wire website's schema.sql once ran.

DROP TABLE IF EXISTS "waitlist";
