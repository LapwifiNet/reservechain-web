import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_FLAG_KEY } from '../decorators/require-flag.decorator';

/**
 * Blocks a route unless its declared feature flag is enabled via env.
 *
 * Refuses with 501 Not Implemented, not 503. AGENTS §2 fixes the gated-module
 * contract at 501, SensitiveController has answered 501 since P5, and the admin
 * console's gated notices render the literal code 501 on /reserves and
 * /redemption. The overlay shipped 503, which would have made the console's
 * displayed contract wrong and put two numbers in the repository for one rule.
 *
 * 501 is also the honester code: the module is not implemented, it is not a
 * healthy service that is temporarily away.
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const flag = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!flag) return true;

    const enabled = String(process.env[flag]).toLowerCase() === 'true';
    if (!enabled) {
      throw new HttpException(
        {
          error: 'module_disabled',
          flag,
          message:
            'This module is not active. It remains gated until explicitly enabled and authorized.',
        },
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
    return true;
  }
}
