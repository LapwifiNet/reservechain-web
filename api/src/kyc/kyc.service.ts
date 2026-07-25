import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKycCaseDto } from './dto/create-kyc-case.dto';
import { ReviewKycCaseDto } from './dto/review-kyc-case.dto';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  list(take = 100) {
    return this.prisma.kycCase.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async get(id: string) {
    const found = await this.prisma.kycCase.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('kyc_case_not_found');
    return found;
  }

  create(dto: CreateKycCaseDto) {
    return this.prisma.kycCase.create({
      data: { ...dto, status: 'pending' },
    });
  }

  async review(id: string, dto: ReviewKycCaseDto, reviewer: string) {
    await this.get(id);
    return this.prisma.kycCase.update({
      where: { id },
      data: {
        status: dto.status,
        riskLevel: dto.riskLevel,
        notes: dto.notes,
        reviewedBy: reviewer,
      },
    });
  }

  /**
   * Illustrative sanctions screening only. This performs NO external call and
   * returns a deterministic stub result. Real provider integration (sanctions /
   * PEP / adverse-media) is INACTIVE pending written authorization and contracts.
   */
  async screen(id: string) {
    await this.get(id);
    return {
      caseId: id,
      provider: 'stub',
      result: 'clear',
      screenedAt: new Date().toISOString(),
      note: 'Illustrative screening only. Live sanctions/PEP screening is inactive pending written authorization.',
    };
  }

  async stats() {
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
