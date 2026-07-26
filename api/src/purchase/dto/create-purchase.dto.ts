import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

export class CreatePurchaseDto {
  @IsString()
  @Length(1, 32)
  programCode!: string;

  @IsNumber()
  @IsPositive()
  tokenAmount!: number;

  // ISO-4217 code for the indicative quote (illustrative only).
  @IsOptional()
  @IsString()
  @Length(3, 3)
  quoteCurrency?: string;
}
