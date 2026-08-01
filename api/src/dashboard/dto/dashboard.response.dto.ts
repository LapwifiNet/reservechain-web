import { ApiProperty } from '@nestjs/swagger';

export class DashboardTotals {
  @ApiProperty()
  waitlist!: number;

  @ApiProperty()
  programs!: number;

  @ApiProperty()
  records!: number;

  @ApiProperty()
  passportsIssued!: number;
}

export class DashboardRegistrationCount {
  @ApiProperty({ enum: ['institution', 'investor', 'partner', 'other'] })
  type!: string;

  @ApiProperty()
  count!: number;
}

export class DashboardActivityRow {
  @ApiProperty()
  assetId!: string;

  @ApiProperty({ description: 'Program NAME, not code — the service maps `r.program.name`.' })
  program!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** `GET /dashboard/stats`. Aggregates only — no row-level PII. */
export class DashboardStats {
  @ApiProperty({ type: DashboardTotals })
  totals!: DashboardTotals;

  @ApiProperty({ type: [DashboardRegistrationCount] })
  registrationsByType!: DashboardRegistrationCount[];

  @ApiProperty({ type: [DashboardActivityRow], description: 'The five most recently updated records.' })
  recentActivity!: DashboardActivityRow[];
}
