import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvestorModule } from '../investor/investor.module';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { RedemptionController } from './redemption.controller';
import { RedemptionService } from './redemption.service';

/**
 * P12, inactive.
 *
 * Imports InvestorModule for InvestorJwtGuard rather than providing the guard
 * itself. This is load-bearing, not tidiness. The overlay listed the guard in
 * its own `providers` while importing only AuthModule, so Nest built it in this
 * module's injector, where the only JwtService is AuthModule's admin signer:
 * the guard then verified investor tokens with JWT_SECRET. Confirmed by
 * request before the fix — a token carrying typ:'investor' but signed with the
 * ADMIN secret passed the guard and reached the service, while a correctly
 * signed investor token was refused. That is invariant 19 defeated by a module
 * import, in the direction that lets a staff-domain token onto investor routes.
 *
 * Registering a local JwtModule here does not fix it either: AuthModule also
 * exports one, and the resolution is ambiguous. Importing the owning module is
 * the only unambiguous form.
 *
 * PrismaModule is deliberately not imported: the service touches no database.
 */
@Module({
  imports: [AuthModule, InvestorModule],
  controllers: [RedemptionController],
  providers: [RedemptionService, FeatureFlagGuard],
})
export class RedemptionModule {}
