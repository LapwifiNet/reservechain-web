import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectRedemptionDto {
  @IsString()
  @MaxLength(2000)
  reason!: string;
}

export class SettleRedemptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  txRef?: string;
}
