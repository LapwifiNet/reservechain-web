import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateAttestationDto {
  @IsString()
  @Length(1, 32)
  programCode!: string;

  @IsNumber()
  @IsPositive()
  circulatingSupply!: number;

  @IsNumber()
  @IsPositive()
  verifiedReserve!: number;

  @IsString()
  @Length(2, 120)
  method!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;
}
