import { Module } from "@nestjs/common";
import { KycController } from "./kyc.controller";
import { KycService } from "./kyc.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [KycController],
  providers: [KycService],
})
export class KycModule {}
