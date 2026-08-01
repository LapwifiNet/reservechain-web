import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * `GET /audit` and `GET /audit/verify` — ADMIN/COMPLIANCE only.
 *
 * `actorEmail` is PII and is deliberately present: it is the attribution field,
 * and the roles that can read it are the roles that can already read the
 * waitlist. Rejected sign-ins store `[PII_REDACTED]` here rather than the
 * attempted address, so the trail cannot be used to enumerate accounts.
 */
export class AuditEventResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Monotonic. The hash chain is ordered by this.' })
  sequence!: number;

  @ApiProperty({ nullable: true, type: String })
  actorId!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'PII. `[PII_REDACTED]` on a rejected unauthenticated attempt.',
  })
  actorEmail!: string | null;

  @ApiProperty({ nullable: true, type: String })
  actorRole!: string | null;

  @ApiProperty()
  action!: string;

  @ApiProperty({ nullable: true, type: String })
  resourceType!: string | null;

  @ApiProperty({ nullable: true, type: String })
  resourceId!: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description:
      'Request body after redaction: secrets become [REDACTED], PII fields become [PII_REDACTED]. Free-form by nature — this is the one response field a generated client cannot narrow.',
  })
  metadata!: unknown;

  @ApiProperty({ nullable: true, type: String })
  ipAddress!: string | null;

  @ApiProperty({ nullable: true, type: String })
  userAgent!: string | null;

  @ApiProperty({ nullable: true, type: String })
  prevHash!: string | null;

  @ApiProperty({ nullable: true, type: String })
  hash!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class AuditListResponse {
  @ApiProperty({ type: [AuditEventResponse] })
  events!: AuditEventResponse[];

  @ApiProperty({ description: 'Total matching the filter, not the page size.' })
  total!: number;
}

export class ChainVerificationResponse {
  @ApiProperty()
  valid!: boolean;

  @ApiPropertyOptional({
    description: 'Present only when `valid` is false. Absent, not null, on a good chain.',
  })
  firstBrokenSequence?: number;

  @ApiProperty()
  totalEvents!: number;
}
