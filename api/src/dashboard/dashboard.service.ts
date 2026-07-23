import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [waitlist, programs, records, passportsIssued] = await Promise.all([
      this.prisma.waitlistEntry.count(),
      this.prisma.assetProgram.count(),
      this.prisma.assetRecord.count(),
      this.prisma.passport.count({ where: { status: 'issued' } }),
    ]);

    const byTypeRaw = await this.prisma.waitlistEntry.groupBy({
      by: ['investorType'],
      _count: { _all: true },
    });
    const registrationsByType = byTypeRaw.map((r) => ({
      type: r.investorType,
      count: r._count._all,
    }));

    const recentActivity = await this.prisma.assetRecord.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { program: true },
    });

    return {
      totals: { waitlist, programs, records, passportsIssued },
      registrationsByType,
      recentActivity: recentActivity.map((r) => ({
        assetId: r.assetId,
        program: r.program.name,
        status: r.status,
        updatedAt: r.updatedAt,
      })),
    };
  }
}
