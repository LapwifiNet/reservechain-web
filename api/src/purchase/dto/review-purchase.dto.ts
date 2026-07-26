import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectPurchaseDto {
  @IsString()
  @MaxLength(2000)
  reason!: string;
}

export class SettlePurchaseDto {
  // Testnet transaction reference for the mint/allocation.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  txRef?: string;
}
