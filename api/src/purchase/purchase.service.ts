import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Token purchase intents — INACTIVE by design.
 *
 * Every method refuses and the service touches no database, for the same reason
 * as WalletService and the P11/P12 pair: AGENTS §2 forbids wiring a gated
 * module to real logic even behind a flag that defaults on.
 *
 * What the overlay shipped, and why it was not kept: a working primary-issuance
 * order book. create() checked KYC and a linked wallet, then persisted an
 * intent — program, token amount, wallet address, network, status — and
 * approve/reject/settle moved it through a lifecycle, with settle() described
 * as "a testnet mint/allocation to the linked wallet". That is an order
 * pipeline for a token that is not issued, against a reserve that is not
 * attested, under a legal structure that is not final. AGENTS §6 forbids even
 * implying tokens are sold; a persisted purchase intent is not an implication,
 * it is a record of one.
 *
 * On what it did NOT do, since this is the module most likely to be assumed
 * worse than it is: it quoted no price, computed no amount, held no key
 * material, and constructed and signed no transaction. `tokenAmount` came from
 * the client, `quoteCurrency` was an ISO-4217 code with no value attached, and
 * `txRef` was a string an admin typed in after the fact. No pricing or
 * signing logic has been removed here, because none existed.
 */
@Injectable()
export class PurchaseService {
  private refuse(operation: string): never {
    throw new HttpException(
      {
        error: 'purchase_inactive',
        operation,
        message:
          'Token purchase is inactive. The route shape is published so integrators can build against a stable contract, but no intent is created, reviewed or settled, and no price or allocation is quoted. Activation requires written authorization.',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  disclosure(): never {
    this.refuse('disclosure');
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
