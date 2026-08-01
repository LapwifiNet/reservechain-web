import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * `settings` (SC-CMS-SETTINGS) — the site mode, waitlist toggle and disclosure
 * overrides from decision D4, plus the three status chips from D5.
 *
 * D4 shipped the collection without a migration. In development that is
 * invisible: the Postgres adapter pushes the schema automatically, so the
 * table appears and the CMS works. In production `push` is off and migrations
 * are the only path, so the table would never have existed there — and
 * `getWebsiteSettings()` swallows the failure by design, returning null and
 * falling back to the env mode, which reads exactly like working. This
 * migration covers both decisions at once because there is no D4-only state
 * left to migrate to.
 *
 * Written with `payload.db.pool.query` to match 20260726_103437_initial.
 * `payload migrate:create` emits `drizzle.execute` with a top-level
 * `drizzle-orm` import; that package is a transitive dependency of the
 * Postgres adapter and is not declared here, so the generated file throws
 * MODULE_NOT_FOUND when the migration runner requires it.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.pool.query(`

DO $$ BEGIN
 CREATE TYPE "public"."enum_settings_site_mode" AS ENUM('development', 'prelaunch', 'waitlist', 'documentation', 'asset-verification', 'eligibility', 'early-participation', 'live-offering', 'redemption', 'enterprise-onboarding');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_settings_publication_status" AS ENUM('pending', 'in-preparation', 'published');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_settings_token_status" AS ENUM('not-issued', 'proposed', 'in-development', 'testnet-deployed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_settings_asset_status" AS ENUM('pending', 'documentation-in-preparation', 'independently-verified');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_settings_disclosure_overrides_locale" AS ENUM('en', 'es', 'it');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"siteMode" "enum_settings_site_mode" NOT NULL,
	"waitlist_open" boolean,
	"publicationStatus" "enum_settings_publication_status" NOT NULL,
	"tokenStatus" "enum_settings_token_status" NOT NULL,
	"assetStatus" "enum_settings_asset_status" NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "settings_disclosure_overrides" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"locale" "enum_settings_disclosure_overrides_locale" NOT NULL,
	"text" varchar NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "settings_disclosure_overrides" ADD CONSTRAINT "settings_disclosure_overrides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "settings_disclosure_overrides_order_idx" ON "settings_disclosure_overrides" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "settings_disclosure_overrides_parent_id_idx" ON "settings_disclosure_overrides" USING btree ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "settings_name_idx" ON "settings" USING btree ("name");
CREATE INDEX IF NOT EXISTS "settings_created_at_idx" ON "settings" USING btree ("created_at");
`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.pool.query(`

DROP TABLE IF EXISTS "settings_disclosure_overrides";
DROP TABLE IF EXISTS "settings";
DROP TYPE IF EXISTS "public"."enum_settings_disclosure_overrides_locale";
DROP TYPE IF EXISTS "public"."enum_settings_asset_status";
DROP TYPE IF EXISTS "public"."enum_settings_token_status";
DROP TYPE IF EXISTS "public"."enum_settings_publication_status";
DROP TYPE IF EXISTS "public"."enum_settings_site_mode";
`)
}
