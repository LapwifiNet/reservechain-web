import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'featureFlag';

/**
 * Marks a controller (or handler) as gated behind an environment feature flag.
 * FeatureFlagGuard refuses the request with 501 when the flag is not "true".
 *
 * Gating is only the outer wall. AGENTS §2 requires that a gated module is not
 * wired to real logic even behind a flag that defaults on, so the handlers
 * behind this decorator are refusals plus shape — flipping the flag does not
 * activate a workflow, it only changes which refusal you get.
 *
 * @example
 * @RequireFlag('REDEMPTION_ENABLED')
 * @UseGuards(FeatureFlagGuard)
 */
export const RequireFlag = (flag: string) => SetMetadata(FEATURE_FLAG_KEY, flag);
