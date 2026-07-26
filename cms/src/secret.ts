/**
 * Resolves the Payload signing secret, enforcing that the CMS is a third,
 * disjoint token domain.
 *
 * Payload issues its own session JWTs signed with this secret. If it ever
 * equalled the API's JWT_SECRET or INVESTOR_JWT_SECRET, a staff or investor
 * token would verify here and a CMS token would verify there — the same
 * one-line domain merge that invariant 19 exists to prevent, reached by
 * configuration instead of by code. So the check is at startup, not in review:
 * three secrets, three domains, and the service refuses to boot otherwise.
 *
 * There is deliberately no development fallback. The overlay shipped
 * `PAYLOAD_SECRET || "dev-insecure-secret-change-me"`, which is exactly the
 * fallback invariant 3 forbids in the API — a shared, public, guessable signing
 * key that silently works until it is signing production sessions.
 */
export function resolvePayloadSecret(): string {
  const secret = process.env.PAYLOAD_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'PAYLOAD_SECRET must be set and at least 32 characters long',
    );
  }

  const collisions: string[] = [];
  if (secret === process.env.JWT_SECRET) collisions.push('JWT_SECRET');
  if (secret === process.env.INVESTOR_JWT_SECRET) {
    collisions.push('INVESTOR_JWT_SECRET');
  }

  if (collisions.length > 0) {
    throw new Error(
      `PAYLOAD_SECRET must differ from ${collisions.join(' and ')} — the CMS, ` +
        'admin and investor token domains are deliberately disjoint',
    );
  }

  return secret;
}
