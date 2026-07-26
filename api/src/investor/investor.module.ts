import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { InvestorController } from './investor.controller';
import { InvestorService } from './investor.service';
import { InvestorJwtGuard } from './investor-jwt.guard';

@Module({
  imports: [
    ConfigModule,
    // The investor domain signs and verifies with its OWN secret, not the
    // admin JWT_SECRET. With a shared secret the typ claim would be the only
    // wall between an investor token and every admin route; a separate secret
    // makes a cross-domain token fail signature verification outright, and the
    // typ checks in the guards become defence in depth rather than the wall.
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
        return {
          secret,
          signOptions: {
            expiresIn: config.get<string>('JWT_EXPIRES_IN') || '12h',
          },
        };
      },
    }),
  ],
  controllers: [InvestorController],
  providers: [InvestorService, InvestorJwtGuard],
  // Exported so other modules reuse THIS instance, built in this module's
  // injector where the only JwtService is the investor one. A module that
  // merely lists InvestorJwtGuard in its own providers gets whichever
  // JwtService its own imports resolve — which is how a redemption route came
  // to accept an admin-signed token. See invariant 34.
  exports: [InvestorJwtGuard],
})
export class InvestorModule {}
