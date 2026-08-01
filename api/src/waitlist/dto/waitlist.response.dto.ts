import { ApiProperty } from '@nestjs/swagger';

/** `POST /waitlist`. Idempotent on email — a resubmission returns the same id. */
export class WaitlistCreated {
  @ApiProperty({ enum: [true] })
  ok!: boolean;

  @ApiProperty()
  id!: string;
}

/** `GET /waitlist/count`. Public. */
export class WaitlistCount {
  @ApiProperty()
  count!: number;
}

/**
 * `GET /waitlist` — ADMIN/COMPLIANCE only.
 *
 * This list DOES return `email`, and `fullName`, and `organization`. Invariant
 * 23 constrains the KYC case list specifically; this route is the admin
 * console's waitlist table and has always shown the registrant. Documented
 * rather than silently narrowed — the shape is the shape.
 *
 * `organization`, `interest` and `locale` are on every row and were missing
 * from the hand-written admin type entirely.
 */
export class WaitlistEntryResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'PII.' })
  fullName!: string;

  @ApiProperty({ description: 'PII.' })
  email!: string;

  @ApiProperty({ enum: ['institution', 'investor', 'partner', 'other'] })
  investorType!: string;

  @ApiProperty()
  consent!: boolean;

  @ApiProperty({ nullable: true, type: String, description: 'PII.' })
  organization!: string | null;

  @ApiProperty({ nullable: true, type: String })
  interest!: string | null;

  @ApiProperty({ enum: ['en', 'es', 'it'] })
  locale!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
