-- Adds the public website's form fields to the API's WaitlistEntry model, so the
-- API can become the single source of truth for waitlist registrations.
--
-- Additive and lossless. `email` is already UNIQUE, which is what makes a
-- resubmission return the existing row instead of creating a duplicate.
--
-- The website's legacy `waitlist` table (previously auto-created by
-- src/lib/store.ts) is deliberately NOT dropped here. It may still hold real
-- registrations from the live site, and dropping it would destroy them. Retiring
-- it needs a separate, explicit data-migration decision.
ALTER TABLE "WaitlistEntry" ADD COLUMN     "interest" TEXT,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "organization" TEXT;
