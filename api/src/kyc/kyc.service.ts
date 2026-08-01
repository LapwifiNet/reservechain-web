import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKycCaseDto } from './dto/create-kyc-case.dto';
import { ReviewKycCaseDto } from './dto/review-kyc-case.dto';
import {
  KycCaseDetail,
  KycCaseListItem,
  KycScreenResult,
  KycStats,
} from './dto/kyc.response.dto';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  list(take = 100): Promise<KycCaseListItem[]> {
    return this.prisma.kycCase.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      // Explicit projection: the investor-email link (P8) is PII and the
      // console table has no use for it, so the list endpoint never returns
      // it. The single-case detail view (get) still does — a compliance
      // officer reviewing one case may need the link, and that route is
      // equally role-guarded.
      select: {
        id: true,
        subjectType: true,
        legalName: true,
        country: true,
        status: true,
        riskLevel: true,
        sanctions: true,
        notes: true,
        reviewedBy: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async get(id: string): Promise<KycCaseDetail> {
    const found = await this.prisma.kycCase.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('kyc_case_not_found');
    return found;
  }

  create(dto: CreateKycCaseDto): Promise<KycCaseDetail> {
    return this.prisma.kycCase.create({
      data: { ...dto, status: 'pending' },
    });
  }

  async review(
    id: string,
    dto: ReviewKycCaseDto,
    reviewer: string,
  ): Promise<KycCaseDetail> {
    await this.get(id);
    return this.prisma.kycCase.update({
      where: { id },
      data: {
        status: dto.status,
        riskLevel: dto.riskLevel,
        notes: dto.notes,
        reviewedBy: reviewer,
        // Set together with reviewedBy, never separately. A compliance
        // decision carrying a named reviewer but no time is incomplete: it
        // cannot be placed against a sanctions list version, a document expiry,
        // or anything else that moves. The column existed and was simply never
        // written, so every reviewed case showed a blank "Reviewed at".
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Illustrative sanctions screening only. This performs NO external call and
   * returns a deterministic stub result. Real provider integration (sanctions /
   * PEP / adverse-media) is INACTIVE pending written authorization and contracts.
   */
  async screen(id: string): Promise<KycScreenResult> {
    await this.get(id);
    // Persist the illustrative outcome so the case (and the investor portal's
    // read-only status card) reflects that the stub ran. 'clear_stub' is
    // deliberately distinct from any value a real provider would write.
    await this.prisma.kycCase.update({
      where: { id },
      data: { sanctions: 'clear_stub' },
    });
    return {
      caseId: id,
      provider: 'stub',
      result: 'clear',
      screenedAt: new Date().toISOString(),
      note: 'Illustrative screening only. Live sanctions/PEP screening is inactive pending written authorization.',
    };
  }

  async stats(): Promise<KycStats> {
    const grouped = await this.prisma.kycCase.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return {
      total: grouped.reduce((sum, g) => sum + g._count._all, 0),
      byStatus: grouped.map((g) => ({
        status: g.status,
        count: g._count._all,
      })),
    };
  }
}
