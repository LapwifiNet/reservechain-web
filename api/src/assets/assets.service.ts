import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssetProgramDetail,
  AssetProgramSummary,
  AssetRecordWithProgram,
} from './dto/assets.response.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  programs(): Promise<AssetProgramSummary[]> {
    return this.prisma.assetProgram.findMany({ orderBy: { code: 'asc' } });
  }

  async program(code: string): Promise<AssetProgramDetail> {
    const p = await this.prisma.assetProgram.findUnique({
      where: { code },
      include: { records: true },
    });
    if (!p) throw new NotFoundException('program_not_found');
    return p;
  }

  registry(take = 100): Promise<AssetRecordWithProgram[]> {
    return this.prisma.assetRecord.findMany({
      orderBy: { updatedAt: 'desc' },
      take,
      include: { program: true },
    });
  }
}
