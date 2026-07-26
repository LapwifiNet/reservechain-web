import { IsEmail, IsString } from 'class-validator';

export class LoginInvestorDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
