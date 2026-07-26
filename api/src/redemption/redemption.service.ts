import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Redemption — INACTIVE by design.
 *
 * Every method refuses, for the same reason as ProofOfReservesService: AGENTS
 * §2 forbids wiring a gated module to real logic even behind a flag that
 * defaults on. The controller, DTOs and Prisma models document the intended
 * contract; no request is created, approved, rejected or settled.
 *
 * What the overlay shipped, and why it was not kept: a complete redemption
 * workflow. create() checked the investor's latest KycCase and persisted a
 * request, approve() incremented a counter and flipped status to "approved" at
 * the threshold, reject() and settle() moved it on, with settle() recording a
 * transaction reference and described in its own comment as "on-chain
 * execution via the Gnosis Safe multisig". One environment variable stood
 * between that and a live redemption pipeline against an asset that is not
 * issued, not custodied and not legally structured for redemption.
 *
 * Note for whoever implements this: the approval counter as shipped incremented
 * once per call with no record of which staff member approved, so the same
 * account could satisfy a two-of-N threshold by calling twice. A real
 * implementation needs distinct approver identities, which is a schema change,
 * not a patch.
 */
@Injectable()
export class RedemptionService {
  private refuse(operation: string): never {
    throw new HttpException(
      {
        error: 'redemption_inactive',
        operation,
        message:
          'Redemption is inactive (P12). The route shape is published so integrators can build against a stable contract, but no redemption request is created, reviewed or settled. Activation requires written authorization.',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  create(): never {
    this.refuse('create');
  }

  listMine(): never {
    this.refuse('listMine');
  }

  listAll(): never {
    this.refuse('listAll');
  }

  approve(): never {
    this.refuse('approve');
  }

  reject(): never {
    this.refuse('reject');
  }

  settle(): never {
    this.refuse('settle');
  }
}
