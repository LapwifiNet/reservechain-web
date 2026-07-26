import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class RegisterInvestorDto {
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
