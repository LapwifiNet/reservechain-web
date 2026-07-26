import { SetMetadata } from '@nestjs/common';

export const ALLOW_SERVICE_WRITE_KEY = 'allowServiceWrite';

/**
 * Opts a single route out of the read-only rule applied to the SERVICE_API_TOKEN
 * principal by JwtAuthGuard, letting a machine caller perform a state-changing
 * request on it.
 *
 * Deliberately narrow. A write authenticated by the shared service token is not
 * attributable to a named person, so anything it touches becomes anonymous in
 * the audit log. Apply it only to routes where that is acceptable — a genuine
 * server-to-server integration, never an operator action that a console user
 * could perform while signed in.
 *
 * Nothing in the codebase uses this today. It exists so that granting machine
 * write access is a visible, reviewable annotation on a specific handler rather
 * than a silent widening of the guard.
 */
export const AllowServiceWrite = () =>
  SetMetadata(ALLOW_SERVICE_WRITE_KEY, true);
