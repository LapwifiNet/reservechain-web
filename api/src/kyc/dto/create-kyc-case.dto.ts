import { IsIn, IsString, Length } from "class-validator";

export class CreateKycCaseDto {
  @IsIn(["person", "entity"])
  subjectType!: "person" | "entity";

  @IsString()
  @Length(2, 120)
  legalName!: string;

  @IsString()
  @Length(2, 56)
  country!: string;
}
