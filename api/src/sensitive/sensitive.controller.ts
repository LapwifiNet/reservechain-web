import { Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';

/**
 * Sensitive modules are intentionally INACTIVE until written authorization.
 * These endpoints exist to document the surface and return 501 Not Implemented
 * so integrators can wire against a stable contract without any live behavior.
 */
@Controller()
export class SensitiveController {
  @Get('proof-of-reserves')
  reserves() {
    throw new HttpException(
      { error: 'proof_of_reserves_inactive', message: 'Proof-of-Reserves is inactive until authorized (P11).' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Post('redemption')
  redemption() {
    throw new HttpException(
      { error: 'redemption_inactive', message: 'Redemption is inactive until authorized (P12).' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
