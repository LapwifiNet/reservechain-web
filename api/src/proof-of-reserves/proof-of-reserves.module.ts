import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { ProofOfReservesController } from './proof-of-reserves.controller';
import { ProofOfReservesService } from './proof-of-reserves.service';

/**
 * P11, inactive. AuthModule supplies JwtService for the staff guards.
 *
 * PrismaModule is deliberately NOT imported: the service touches no database.
 * The ReserveAttestation model exists in the schema as published shape, and the
 * table it creates stays empty until the module is genuinely implemented.
 */
@Module({
  imports: [AuthModule],
  controllers: [ProofOfReservesController],
  providers: [ProofOfReservesService, FeatureFlagGuard],
})
export class ProofOfReservesModule {}
