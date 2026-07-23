import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  // TODO(P9): admin-only. Guard with authentication + RBAC.
  @Get('stats')
  stats() {
    return this.service.stats();
  }
}
