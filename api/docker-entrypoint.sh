#!/bin/sh
# Applies pending Prisma migrations before the API accepts traffic.
#
# `migrate deploy` is used rather than `migrate dev`: it only applies existing
# migration files and never generates or resets anything, so it is safe to run
# on every container start.
set -e

echo "[entrypoint] applying database migrations..."
npx prisma migrate deploy

# Seeding is opt-in and never runs in production (the seed script itself also
# refuses to create admin users when NODE_ENV=production).
if [ "$RUN_DB_SEED" = "true" ]; then
  echo "[entrypoint] seeding database..."
  npm run db:seed
fi

echo "[entrypoint] starting API..."
exec "$@"
