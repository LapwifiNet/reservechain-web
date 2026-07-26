import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator';

export class CreateKycCaseDto {
  @IsIn(['person', 'entity'])
  subjectType!: 'person' | 'entity';

  @IsString()
  @Length(2, 120)
  legalName!: string;

  @IsString()
  @Length(2, 56)
  country!: string;

  // P8: optional link to a portal investor. The portal's read-only status
  // endpoint matches the investor's latest case by this email. PII — the audit
  // interceptor redacts it like every other email field.
  @IsOptional()
  @IsEmail()
  email?: string;
}
