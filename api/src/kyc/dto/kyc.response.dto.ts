import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response shapes for the KYC module.
 *
 * Two case classes, not one, because the list and the detail endpoints return
 * genuinely different shapes: `list()` applies an explicit `select` that omits
 * `email`, `get()` does not (invariant 23 — the detail route is role-guarded
 * and a reviewer needs the link). `admin/src/lib/types.ts` modelled both with a
 * single `KycCase`, which is how a field that only exists on one of them ends
 * up being read on the other.
 *
 * The string unions come from the `@IsIn` rules on CreateKycCaseDto and
 * ReviewKycCaseDto. The database columns are plain `String`, so these are the
 * write-side constraint expressed on the read side; a row written before a
 * constraint changed could still carry something else.
 */

export type KycSubjectType = 'person' | 'entity';
export type KycCaseStatus = 'pending' | 'in_review' | 'approved' | 'rejected';
export type KycRiskLevel = 'low' | 'medium' | 'high' | 'unrated';

export class KycCaseListItem {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['person', 'entity'] })
  subjectType!: string;

  @ApiProperty()
  legalName!: string;

  @ApiProperty({ description: 'ISO 3166-1 alpha-2.' })
  country!: string;

  @ApiProperty({ enum: ['pending', 'in_review', 'approved', 'rejected'] })
  status!: string;

  @ApiPropertyOptional({
    enum: ['low', 'medium', 'high', 'unrated'],
    nullable: true,
  })
  riskLevel!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Persisted screening outcome. `clear_stub` is written by the illustrative screener and is not a real screening result. Null means never screened.',
  })
  sanctions!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewedBy!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  reviewedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/**
 * The single-case shape. Adds `email` — the optional link to a portal
 * investor — which the list endpoint deliberately does not return.
 */
export class KycCaseDetail extends KycCaseListItem {
  @ApiPropertyOptional({
    nullable: true,
    description:
      'PII. Present on this role-guarded detail route only; the case list omits it (invariant 23).',
  })
  email!: string | null;
}

export class KycStatusCount {
  @ApiProperty({ enum: ['pending', 'in_review', 'approved', 'rejected'] })
  status!: string;

  @ApiProperty()
  count!: number;
}

export class KycStats {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [KycStatusCount] })
  byStatus!: KycStatusCount[];
}

/**
 * The illustrative screener's result. `provider` is always `stub` and
 * `result` is always `clear`: no external call is made. Documented as its own
 * shape so nobody reads it as a screening outcome.
 */
export class KycScreenResult {
  @ApiProperty()
  caseId!: string;

  @ApiProperty({ enum: ['stub'], description: 'Always `stub`. No provider is called.' })
  provider!: string;

  @ApiProperty({ enum: ['clear'], description: 'Always `clear`. Not a screening result.' })
  result!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  screenedAt!: string;

  @ApiProperty()
  note!: string;
}
