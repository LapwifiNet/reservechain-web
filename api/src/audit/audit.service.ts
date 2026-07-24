import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

export interface AuditRecordInput {
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ChainVerificationResult {
  valid: boolean;
  firstBrokenSequence?: number;
  totalEvents: number;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an audit event with tamper-evident chain hashing.
   * The hash is computed over the canonical serialization of the record plus prevHash.
   */
  async record(input: AuditRecordInput): Promise<void> {
    // Get the last event to obtain prevHash
    const lastEvent = await this.prisma.auditEvent.findFirst({
      orderBy: { sequence: 'desc' },
    });

    const prevHash = lastEvent?.hash || null;
    const sequence = lastEvent ? lastEvent.sequence + 1 : 1;

    // Compute hash over canonical serialization
    const hash = this.computeHash({
      sequence,
      actorId: input.actorId || null,
      actorEmail: input.actorEmail || null,
      actorRole: input.actorRole || null,
      action: input.action,
      resourceType: input.resourceType || null,
      resourceId: input.resourceId || null,
      metadata: input.metadata || null,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
      prevHash,
    });

    await this.prisma.auditEvent.create({
      data: {
        sequence,
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        actorRole: input.actorRole,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: input.metadata,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        prevHash,
        hash,
      },
    });
  }

  /**
   * Verifies the entire audit chain for tamper evidence.
   * Returns the first broken link if any, otherwise reports valid.
   */
  async verifyChain(): Promise<ChainVerificationResult> {
    const events = await this.prisma.auditEvent.findMany({
      orderBy: { sequence: 'asc' },
    });

    if (events.length === 0) {
      return { valid: true, totalEvents: 0 };
    }

    let prevHash: string | null = null;

    for (const event of events) {
      const expectedHash = this.computeHash({
        sequence: event.sequence,
        actorId: event.actorId,
        actorEmail: event.actorEmail,
        actorRole: event.actorRole,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        metadata: event.metadata,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        prevHash,
      });

      if (event.hash !== expectedHash) {
        return {
          valid: false,
          firstBrokenSequence: event.sequence,
          totalEvents: events.length,
        };
      }

      prevHash = event.hash;
    }

    return { valid: true, totalEvents: events.length };
  }

  /**
   * Computes SHA-256 hash over canonical serialization of audit record.
   */
  private computeHash(data: Record<string, unknown>): string {
    const canonical = JSON.stringify(data, Object.keys(data).sort());
    return createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Lists audit events with pagination and filters.
   * Admin and compliance only.
   */
  async list(params: {
    skip?: number;
    take?: number;
    actorId?: string;
    action?: string;
    resourceType?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const { skip = 0, take = 50, actorId, action, resourceType, fromDate, toDate } = params;

    const where: Record<string, unknown> = {};

    if (actorId) where.actorId = actorId;
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) (where.createdAt as Record<string, Date>).gte = fromDate;
      if (toDate) (where.createdAt as Record<string, Date>).lte = toDate;
    }

    const [events, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { sequence: 'desc' },
        skip,
        take,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return { events, total };
  }
}
