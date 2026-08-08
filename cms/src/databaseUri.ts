/**
 * Resolves the CMS database connection string.
 *
 * There is deliberately no fallback. This file exists because there used to be
 * one: the Postgres adapter was configured as
 *
 *   process.env.DATABASE_URI ||
 *     "postgresql://openrwa:openrwa@localhost:5432/openrwa_cms"
 *
 * and `localhost:5432` is the API's Postgres service in docker-compose.yml. A
 * missing `cms/.env` therefore did not fail. It silently connected the CMS to
 * the API's database server and ran Payload migrations there, crossing the exact
 * boundary docker-compose.yml documents as inviolable: "the CMS is its own trust
 * boundary, with its own credentials, and must never reach API tables."
 *
 * A connection string is not the kind of value that can carry a safe default.
 * Getting a secret wrong fails closed - the signature does not verify. Getting a
 * database host wrong fails *open*: the connection is established, the migration
 * runs, the CLI prints "Done", and the damage is in a database nobody was
 * looking at. The failure mode is silent success, which is the same failure mode
 * that let decision D4 ship without a migration and still look correct.
 *
 * So it is required, exactly like PAYLOAD_SECRET, and the service refuses to
 * boot without it.
 */
export function resolveDatabaseUri(): string {
  const uri = process.env.DATABASE_URI?.trim();

  if (!uri) {
    throw new Error(
      "DATABASE_URI must be set - copy cms/.env.example to cms/.env. There is " +
        "no default: the CMS owns its own Postgres instance and must never " +
        "connect to the API's database.",
    );
  }

  return uri;
}
