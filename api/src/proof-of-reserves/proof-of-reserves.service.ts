import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Proof-of-Reserves — INACTIVE by design.
 *
 * Every method refuses. This module is deliberately not an implementation
 * waiting for a switch: AGENTS §2 requires that a gated module is not wired to
 * real logic "even behind a feature flag that defaults on", so turning
 * PROOF_OF_RESERVES_ENABLED on gets a caller past FeatureFlagGuard and no
 * further. The controller, DTOs and Prisma models document the intended
 * contract; nothing computes, stores or publishes a reserve figure.
 *
 * What the overlay shipped, and why it was not kept: working implementations.
 * create() computed `ratio = verifiedReserve / circulatingSupply` and persisted
 * it, publish() flipped an attestation to published, and the public status
 * route served that ratio with circulating supply, verified reserve and an
 * attester name. Flipping one environment variable would have exposed a live
 * reserve-coverage claim — the single most consequential number this platform
 * can state — computed from whatever an operator typed in, with no attestation
 * process, no custodian evidence and no legal sign-off behind it.
 *
 * Activation is not a configuration change. It requires the reserve
 * methodology, custodian and auditor arrangements, and written authorization,
 * and then an implementation reviewed on its own terms.
 */
@Injectable()
export class ProofOfReservesService {
  private refuse(operation: string): never {
    throw new HttpException(
      {
        error: 'proof_of_reserves_inactive',
        operation,
        message:
          'Proof-of-Reserves is inactive (P11). The route shape is published so integrators can build against a stable contract, but no attestation is computed, stored or served. Activation requires written authorization.',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  publicStatus(): never {
    this.refuse('status');
  }

  list(): never {
    this.refuse('list');
  }

  create(): never {
    this.refuse('create');
  }

  publish(): never {
    this.refuse('publish');
  }
}
