import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateWaitlistDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsIn(['institution', 'investor', 'partner', 'other'])
  investorType: string;

  @IsBoolean()
  consent: boolean;
}
