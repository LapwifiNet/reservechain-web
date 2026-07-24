import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewKycCaseDto {
  @IsIn(["pending", "in_review", "approved", "rejected"])
  status!: "pending" | "in_review" | "approved" | "rejected";

  @IsOptional()
  @IsIn(["low", "medium", "high", "unrated"])
  riskLevel?: "low" | "medium" | "high" | "unrated";

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
