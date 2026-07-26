import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateWaitlistDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName: string;

  @IsEmail()
  email: string;

  @IsIn(['institution', 'investor', 'partner', 'other'])
  investorType: string;

  // The API is the enforcement point for consent now that the public website
  // posts here instead of writing its own store. @IsBoolean alone accepts
  // `false`, which would store a registration with no recorded consent, so the
  // value must be exactly true.
  @IsBoolean()
  @Equals(true)
  consent: boolean;

  // Optional context captured from the public website form.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  organization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  interest?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;
}
