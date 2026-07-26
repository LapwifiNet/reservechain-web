import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Wallet linking — INACTIVE by design.
 *
 * Every method refuses and the service touches no database. AGENTS §2 forbids
 * wiring a gated module to real logic "even behind a feature flag that defaults
 * on", so enabling WALLET_ENABLED moves the refusal from the guard to here and
 * activates nothing.
 *
 * What the overlay shipped, and why it was not kept: a working implementation.
 * link() upserted a user-supplied EVM address against the investor's email,
 * me() returned the stored row, revoke() flipped its status, and list()
 * exposed every linked wallet to staff. A wallet address is durable, publicly
 * correlatable identity data tied to a named investor: persisting it is a
 * privacy commitment, not a scaffolding detail, and it is not one this platform
 * has made yet.
 *
 * Nothing here handles key material. There is no private key, mnemonic, seed
 * phrase or signer anywhere in this module — an address is a public identifier,
 * and linking one never requires custody of the key behind it. Any future
 * implementation must keep that property: proof of control is a signature the
 * holder produces, never a secret this service receives.
 */
@Injectable()
export class WalletService {
  private refuse(operation: string): never {
    throw new HttpException(
      {
        error: 'wallet_inactive',
        operation,
        message:
          'Wallet linking is inactive. The route shape is published so integrators can build against a stable contract, but no wallet address is stored, read or revoked. Activation requires written authorization.',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  link(): never {
    this.refuse('link');
  }

  me(): never {
    this.refuse('me');
  }

  revoke(): never {
    this.refuse('revoke');
  }

  list(): never {
    this.refuse('list');
  }
}
