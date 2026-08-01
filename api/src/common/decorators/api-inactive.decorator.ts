import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Marks a controller whose entire route table is inactive.
 *
 * The gated modules are a published contract, not an implementation behind a
 * switch: with the feature flag off `FeatureFlagGuard` refuses at the guard,
 * and with it on the service still refuses. Either way the answer is 501.
 *
 * The document has to say that, because a generated client is read as an offer.
 * A client exposing `createAttestation()` with a 201 response invites a caller
 * to attest to a reserve that does not exist — the single most damaging thing
 * this project could publish (invariant 33). So every operation on these
 * controllers is tagged `inactive`, and the generator marks anything carrying
 * that tag `deprecated: true`, which surfaces in the generated client as a
 * compile-time warning at the call site rather than a runtime surprise.
 *
 * `INACTIVE_TAG` is the single source of that rule — the generator reads this
 * constant, it does not keep its own list of gated path prefixes.
 */
export const INACTIVE_TAG = 'inactive';

export function ApiInactive(phase: string, flag?: string) {
  const gate = flag
    ? `Gated by ${flag}; with the flag on the service still refuses.`
    : 'Refuses unconditionally.';
  return applyDecorators(
    ApiTags(INACTIVE_TAG),
    ApiResponse({
      status: 501,
      description: `INACTIVE (${phase}). ${gate} Requires written authorization before it does anything.`,
    }),
  );
}
