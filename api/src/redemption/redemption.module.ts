import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { InvestorJwtGuard } from '../investor/investor-jwt.guard';
import { RedemptionController } from './redemption.controller';
import { RedemptionService } from './redemption.service';

/**
 * P12, inactive.
 *
 * InvestorJwtGuard must verify with INVESTOR_JWT_SECRET, so this module
 * registers the investor JwtModule rather than relying on AuthModule's, which
 * is the admin domain (invariant 19). The overlay provided InvestorJwtGuard
 * while importing only AuthModule, which would have handed it the admin
 * signer and quietly merged the two token domains on this module's routes.
 *
 * PrismaModule is deliberately not imported: the service touches no database.
 */
@Module({
  imports: [
    AuthModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('INVESTOR_JWT_SECRET');
        if (!secret || secret.length < 32) {
          throw new Error(
            'INVESTOR_JWT_SECRET must be set and at least 32 characters long',
          );
        }
        if (secret === config.get<string>('JWT_SECRET')) {
          throw new Error(
            'INVESTOR_JWT_SECRET must differ from JWT_SECRET — the investor and admin token domains are deliberately disjoint',
          );
        }
        return { secret };
      },
    }),
  ],
  controllers: [RedemptionController],
  providers: [RedemptionService, FeatureFlagGuard, InvestorJwtGuard],
})
export class RedemptionModule {}
