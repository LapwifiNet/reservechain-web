import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response shapes for the investor portal module.
 *
 * `InvestorPublic` is the only investor shape that ever leaves the process.
 * `passwordHash` exists on the Prisma row and is stripped by `toPublic()`; the
 * type now says so, so a future handler that returns the row directly stops
 * compiling instead of leaking it (invariant 23, AGENTS §5.8).
 */

export class InvestorPublic {
  @ApiProperty({
    nullable: true,
    type: String,
    description:
      'Null when the caller has a valid token but no investor row — `status` falls back to an email-only profile rather than 404ing.',
  })
  id!: string | null;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  memberSince!: Date | null;
}

export class InvestorAuthResult {
  @ApiProperty({ description: 'Investor-domain JWT (typ=investor). Not accepted by any admin route.' })
  accessToken!: string;

  @ApiProperty({ type: InvestorPublic })
  investor!: InvestorPublic;
}

export class InvestorWaitlistSummary {
  @ApiProperty()
  investorType!: string;

  @ApiProperty({ nullable: true, type: String })
  organization!: string | null;

  @ApiProperty({ nullable: true, type: String })
  interest!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  joinedAt!: Date;
}

export class InvestorKycSummary {
  @ApiProperty({
    enum: ['not_started', 'pending', 'in_review', 'approved', 'rejected'],
    description:
      '`not_started` is synthesised when no case exists; the other values come from the case row.',
  })
  status!: string;

  @ApiProperty({ enum: ['low', 'medium', 'high', 'unrated'] })
  riskLevel!: string;

  @ApiProperty({
    description:
      'Never a real screening result. `not_screened` when nothing ran, `clear_stub` when the illustrative screener did.',
  })
  sanctions!: string;
}

export class InvestorProgramSummary {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  metal!: string;

  @ApiProperty()
  purity!: string;

  @ApiProperty()
  status!: string;
}

export class InvestorStatus {
  @ApiProperty({ type: InvestorPublic })
  profile!: InvestorPublic;

  @ApiProperty({ type: InvestorWaitlistSummary, nullable: true })
  waitlist!: InvestorWaitlistSummary | null;

  @ApiProperty({ type: InvestorKycSummary })
  kyc!: InvestorKycSummary;

  @ApiProperty({ type: [InvestorProgramSummary] })
  programs!: InvestorProgramSummary[];
}
