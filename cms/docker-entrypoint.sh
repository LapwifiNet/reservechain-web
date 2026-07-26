#!/bin/sh
# Applies pending Payload migrations before the CMS accepts traffic.
#
# Payload's postgres adapter only auto-pushes the schema in development. Under
# NODE_ENV=production it does neither push nor migrate, so without this step the
# container boots happily and then 500s on every request that touches the
# database — the tables simply do not exist. `payload migrate` only applies
# existing migration files, so it is safe to run on every container start.
set -e

echo "[entrypoint] applying CMS migrations..."
npx payload migrate

# Seeding is opt-in and never seeds users in production (the seed script itself
# also refuses when NODE_ENV=production). seed:prod runs the compiled seed: the
# runtime image ships dist/ only, so the ts-node `seed` script cannot resolve
# its source here.
if [ "$RUN_CMS_SEED" = "true" ]; then
  echo "[entrypoint] seeding CMS..."
  npm run seed:prod
fi

echo "[entrypoint] starting CMS..."
exec "$@"
