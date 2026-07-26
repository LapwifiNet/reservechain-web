import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
await payload.db.pool.query(`

DO $$ BEGIN
 CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'viewer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_media_doc_type" AS ENUM('coa', 'image', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_asset_programs_metal" AS ENUM('copper', 'nickel', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_asset_programs_stage" AS ENUM('illustrative', 'active', 'not_for_sale');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_asset_programs_status" AS ENUM('draft', 'published');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_asset_records_unit" AS ENUM('kg', 'g', 't', 'units');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_passports_stage" AS ENUM('illustrative', 'provisional', 'full');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."enum_passports_status" AS ENUM('draft', 'published');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"role" "enum_users_role" NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"email" varchar NOT NULL,
	"reset_password_token" varchar,
	"reset_password_expiration" timestamp(3) with time zone,
	"salt" varchar,
	"hash" varchar,
	"login_attempts" numeric,
	"lock_until" timestamp(3) with time zone
);

CREATE TABLE IF NOT EXISTS "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"alt" varchar,
	"docType" "enum_media_doc_type",
	"issuer" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"url" varchar,
	"filename" varchar,
	"mime_type" varchar,
	"filesize" numeric,
	"width" numeric,
	"height" numeric,
	"focal_x" numeric,
	"focal_y" numeric
);

CREATE TABLE IF NOT EXISTS "asset_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"code" varchar NOT NULL,
	"metal" "enum_asset_programs_metal" NOT NULL,
	"purity" varchar,
	"summary" varchar,
	"stage" "enum_asset_programs_stage",
	"status" "enum_asset_programs_status",
	"disclosure" varchar,
	"slug" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "asset_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"lot" varchar NOT NULL,
	"quantity" numeric,
	"unit" "enum_asset_records_unit",
	"certificate_ref" varchar,
	"custody" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "asset_records_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"asset_programs_id" integer,
	"media_id" integer
);

CREATE TABLE IF NOT EXISTS "passports_highlights" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"label" varchar NOT NULL,
	"value" varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS "passports" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"notes" jsonb,
	"stage" "enum_passports_stage",
	"status" "enum_passports_status",
	"token_mapping_activated" boolean,
	"token_mapping_contract_address" varchar,
	"token_mapping_circulating_supply" numeric,
	"disclosure" varchar,
	"slug" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "passports_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"asset_programs_id" integer,
	"asset_records_id" integer
);

CREATE TABLE IF NOT EXISTS "payload_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"value" jsonb,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"users_id" integer
);

CREATE TABLE IF NOT EXISTS "payload_migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"batch" numeric,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "asset_records_rels" ADD CONSTRAINT "asset_records_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."asset_records"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "asset_records_rels" ADD CONSTRAINT "asset_records_rels_asset_programs_fk" FOREIGN KEY ("asset_programs_id") REFERENCES "public"."asset_programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "asset_records_rels" ADD CONSTRAINT "asset_records_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "passports_highlights" ADD CONSTRAINT "passports_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."passports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "passports_rels" ADD CONSTRAINT "passports_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."passports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "passports_rels" ADD CONSTRAINT "passports_rels_asset_programs_fk" FOREIGN KEY ("asset_programs_id") REFERENCES "public"."asset_programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "passports_rels" ADD CONSTRAINT "passports_rels_asset_records_fk" FOREIGN KEY ("asset_records_id") REFERENCES "public"."asset_records"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename");
CREATE UNIQUE INDEX IF NOT EXISTS "asset_programs_code_idx" ON "asset_programs" USING btree ("code");
CREATE UNIQUE INDEX IF NOT EXISTS "asset_programs_slug_idx" ON "asset_programs" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "asset_programs_created_at_idx" ON "asset_programs" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "asset_records_created_at_idx" ON "asset_records" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "asset_records_rels_order_idx" ON "asset_records_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "asset_records_rels_parent_idx" ON "asset_records_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "asset_records_rels_path_idx" ON "asset_records_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "asset_records_rels_asset_programs_id_idx" ON "asset_records_rels" USING btree ("asset_programs_id");
CREATE INDEX IF NOT EXISTS "asset_records_rels_media_id_idx" ON "asset_records_rels" USING btree ("media_id");
CREATE INDEX IF NOT EXISTS "passports_highlights_order_idx" ON "passports_highlights" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "passports_highlights_parent_id_idx" ON "passports_highlights" USING btree ("_parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "passports_slug_idx" ON "passports" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "passports_created_at_idx" ON "passports" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "passports_rels_order_idx" ON "passports_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "passports_rels_parent_idx" ON "passports_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "passports_rels_path_idx" ON "passports_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "passports_rels_asset_programs_id_idx" ON "passports_rels" USING btree ("asset_programs_id");
CREATE INDEX IF NOT EXISTS "passports_rels_asset_records_id_idx" ON "passports_rels" USING btree ("asset_records_id");
CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
await payload.db.pool.query(`

DROP TABLE "users";
DROP TABLE "media";
DROP TABLE "asset_programs";
DROP TABLE "asset_records";
DROP TABLE "asset_records_rels";
DROP TABLE "passports_highlights";
DROP TABLE "passports";
DROP TABLE "passports_rels";
DROP TABLE "payload_preferences";
DROP TABLE "payload_preferences_rels";
DROP TABLE "payload_migrations";`);
}
