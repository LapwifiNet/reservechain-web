import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvestorModule } from '../investor/investor.module';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

/**
 * Gated and inactive. PrismaModule is deliberately not imported: the service
 * touches no database.
 *
 * InvestorModule is imported rather than listing InvestorJwtGuard here, so the
 * guard resolves from its owning module. Both guards also bind their own
 * signing key (invariant 19), which is what actually makes this safe — the
 * import is the tidy form, not the load-bearing one.
 */
@Module({
  imports: [AuthModule, InvestorModule],
  controllers: [WalletController],
  providers: [WalletService, FeatureFlagGuard],
})
export class WalletModule {}
