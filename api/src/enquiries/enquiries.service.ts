import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { EnquiryCreated } from './dto/enquiry.response.dto';

/**
 * Enterprise / asset-owner / industrial-buyer / contact enquiries (FR-WEB
 * SC-WEB-ENT / ASSETOWNER / BUYER / CONTACT). Mirrors the waitlist pattern:
 * idempotent-ish write, strict DTO, no money/wallet/token-reservation fields.
 */
@Injectable()
export class EnquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnquiryDto): Promise<EnquiryCreated> {
    try {
      const entry = await this.prisma.enquiry.create({
        data: {
          kind: dto.kind,
          fullName: dto.fullName,
          email: dto.email,
          company: dto.company ?? null,
          message: dto.message,
          locale: dto.locale ?? 'en',
        },
      });
      return { ok: true, id: entry.id };
    } catch (e: any) {
      throw new BadRequestException(
        `enquiry_rejected: ${e?.message ?? 'unknown'}`,
      );
    }
  }

  list(take = 50) {
    return this.prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
