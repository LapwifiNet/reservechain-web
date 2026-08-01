import { ApiProperty } from '@nestjs/swagger';
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
  //
  // `enum: [true]` is not decoration: the class-validator shim reads @IsIn but
  // has no rule for @Equals, so without it the generated schema says `boolean`
  // and every generated client offers `consent: false` — a value this route
  // rejects, and one that would store a registration with no recorded consent
  // if it ever stopped rejecting it. The hand-written mobile type had this
  // right (`consent: true`) and the generator was about to lose it.
  @ApiProperty({ enum: [true], description: 'Must be exactly true.' })
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
