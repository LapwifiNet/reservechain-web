#!/usr/bin/env bash
#
# scripts/rebrand.sh
#
# One-shot mechanical rename of the pre-open-source brand to OpenRWA.
# Run it once, on a clean tree, and keep it in its own commit so that the
# diff stays reviewable and separate from real code changes.
#
#   git switch chore/rebrand-openrwa
#   bash scripts/rebrand.sh
#   npm install && (cd api && npm install) && (cd admin && npm install) && (cd cms && npm install)
#   git add -A && git commit -m "chore: mechanical rebrand to OpenRWA"
#
# What it deliberately does NOT do:
#   * rename the GitHub repository - that is a settings change, there is no API for it
#   * rewrite git history - the old name stays in old commits, and that is fine
#   * rotate the seed credentials - see the checklist it prints at the end
#   * touch lockfiles - regenerate those with npm install instead

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git status --porcelain)" ]; then
  echo "error: working tree is dirty. Commit or stash first." >&2
  exit 1
fi

# GNU sed is required: BSD sed has no \\b word boundary and a different -i.
SED=sed
if ! sed --version >/dev/null 2>&1; then
  if command -v gsed >/dev/null 2>&1; then
    SED=gsed
  else
    echo "error: GNU sed required (macOS: brew install gnu-sed)" >&2
    exit 1
  fi
fi

RULES="$(mktemp)"
trap 'rm -f "$RULES"' EXIT

cat >"$RULES" <<'RULESEOF'
# --- order matters: most specific first, generic catch-all last ---

# Mobile bundle identifier
s/io\.openrwa\.app/io.openrwa.app/g

# Hosts. openrwa.example is RFC 2606 - swap in your own domain afterwards.
s/staging-api\.openrwa\.example/staging-api.openrwa.example/g
s/staging-cms\.openrwa\.example/staging-cms.openrwa.example/g
s/staging\.openrwa\.example/staging.openrwa.example/g
s/([A-Za-z0-9-]+\.)?openrwa\.(io|site)/\1openrwa.example/g

# Solidity contract, its test and its deploy scripts
s/OpenRWAToken/OpenRWAToken/g

# Token name and ticker
s/OpenRWA Token/OpenRWA Token/g
s/\bRCM\b/ORWA/g

# Cookies, storage keys, CSS custom properties
s/orwa_session/orwa_session/g
s/orwa_participant/orwa_participant/g
s/orwa_consent/orwa_consent/g
s/--orwa-/--orwa-/g

# AWS: ECR namespace, ECS cluster, Secrets path, log group, SNS topic,
# CloudWatch dashboard, RDS identifier
s|openrwa/([a-z0-9-]+)|openrwa/\1|g
s/openrwa-(dev|staging|prod)/openrwa-\1/g
s/openrwa-<env>/openrwa-<env>/g

# Databases and roles
s/openrwa_cms/openrwa_cms/g
s/openrwa_dev/openrwa_dev/g

# npm package names
s/openrwa/openrwa/g
s/openrwa-api/openrwa-api/g
s/openrwa-admin/openrwa-admin/g
s/openrwa-cms/openrwa-cms/g

# Seed mailboxes
s/@openrwa\.local/@openrwa.local/g

# Catch-all
s/OpenRWA/OpenRWA/g
s/OPENRWA/OPENRWA/g
s/openrwa/openrwa/g
RULESEOF

SKIP='(^|/)(node_modules|\.git)/|(^|/)package-lock\.json$|\.(png|jpe?g|gif|webp|ico|svgz|pdf|zip|gz|woff2?|ttf|otf|eot|mp4|keystore|jks)$'
MATCH='openrwa|OpenRWA|OPENRWA|orwa_session|orwa_participant|orwa_consent|--orwa-|\bRCM\b'

changed=0
while IFS= read -r f; do
  printf '%s' "$f" | grep -Eq "$SKIP" && continue
  grep -Iq . "$f" 2>/dev/null || continue          # skip binaries
  grep -Eq "$MATCH" "$f" || continue
  "$SED" -E -i -f "$RULES" "$f"
  changed=$((changed + 1))
done < <(git ls-files)

echo "rewrote $changed file(s)"

# Rename the files that carry the old name (contracts, their tests, docs).
while IFS= read -r f; do
  new=$(printf '%s' "$f" | "$SED" -E 's/OpenRWA/OpenRWA/g; s/openrwa/openrwa/g')
  [ "$f" = "$new" ] && continue
  mkdir -p "$(dirname "$new")"
  git mv "$f" "$new"
  echo "renamed $f -> $new"
done < <(git ls-files | grep -Ei 'openrwa' || true)

cat <<'CHECKEOF'

Done. Now, in order:

  1. npm install, and again in api/, admin/ and cms/, to regenerate lockfiles.
  2. grep -ri --exclude-dir=node_modules -e openrwa -e ORWA .
     Expect no hits outside git history.
  3. npm run lint && npm run typecheck && npm run test && npm run verify:screens
     cd contracts && forge test
  4. Read the diff. The catch-all rule is blunt on purpose; check any prose
     that used the old name as a company rather than as a product.

Still manual - this script cannot do these:

  * Rename the GitHub repository to openrwa, then update your git remote.
  * Rotate every seed credential. The old admin, compliance, investor and CMS
    passwords are in public git history and must be treated as compromised.
  * Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_COMPLIANCE_EMAIL /
    SEED_COMPLIANCE_PASSWORD / SEED_INVESTOR_EMAIL / SEED_INVESTOR_PASSWORD /
    CMS_SEED_EMAIL / CMS_SEED_PASSWORD. Generate them with
    openssl rand -base64 24. The seeders refuse to run when they are unset.
  * Take down the old demo deployment and release its DNS record.
  * Replace the client-authored disclosure text in messages/{en,es,it}.json
    with the project's own wording, in all three locales.
  * Tag v0.1.
CHECKEOF
