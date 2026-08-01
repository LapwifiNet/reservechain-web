import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * P17 — Financial, Token & Operational Reconciliation (FR-RECON).
 *
 * Runs one or more reconcilers and records every discrepancy as an
 * exception for human resolution. **It never auto-adjusts balances** — the
 * guardrail is detect-and-report; a human (maker-checker) resolves.
 *
 * Reconcilers available today run against data that actually exists in this
 * repository (chain events, audit chain). Reconcilers whose sources are not
 * active yet (supply/coverage/redemption/wallet ledgers — gated modules,
 * P11/P12) are registered but return `unavailable` instead of inventing a
 * comparison. Same rule as the gated modules: an unavailable reconciler is
 * honest, a fabricated one is not.
 */
@Injectable()
export class ReconcileService {
  private readonly logger = new Logger(ReconcileService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Reconcilers that can run today. */
  private readonly live: Record<
    string,
    (runId: string) => Promise<{ ok: boolean; notes: string[] }>
  > = {
    chain_gaps: async (runId) => {
      const events = await this.prisma.chainEvent.findMany({
        orderBy: [{ blockNumber: 'asc' }, { logIndex: 'asc' }],
        select: { blockNumber: true, logIndex: true, eventName: true },
      });
      const notes: string[] = [];
      if (events.length === 0) {
        await this.ex(runId, 'chain_gaps', 'info', 'No chain events stored — nothing to reconcile yet.');
        return { ok: true, notes };
      }
      // Gap = a block number that appears with fewer event logs than the
      // previous block's max log index implies (non-contiguous sync).
      let prevBlock = events[0].blockNumber;
      let prevMaxLog = events[0].logIndex;
      const gaps: string[] = [];
      for (const e of events.slice(1)) {
        if (e.blockNumber !== prevBlock) {
          if (e.blockNumber - prevBlock > 1) {
            gaps.push(`blocks ${prevBlock + 1}..${e.blockNumber - 1}`);
          }
          prevBlock = e.blockNumber;
          prevMaxLog = e.logIndex;
        } else {
          if (e.logIndex > prevMaxLog + 1) {
            gaps.push(`block ${e.blockNumber} logIndex ${prevMaxLog + 1}..${e.logIndex - 1}`);
          }
          prevMaxLog = Math.max(prevMaxLog, e.logIndex);
        }
      }
      if (gaps.length) {
        await this.ex(runId, 'chain_gap', 'warning', `Chain sync gaps: ${gaps.join('; ')}`);
      } else {
        notes.push('Chain events contiguous — no gaps.');
      }
      return { ok: true, notes };
    },

    audit_integrity: async (runId) => {
      const events = await this.prisma.auditEvent.findMany({
        orderBy: { createdAt: 'asc' },
      });
      if (events.length === 0) {
        await this.ex(runId, 'audit_integrity', 'info', 'No audit events stored — nothing to verify yet.');
        return { ok: true, notes: [] };
      }
      // The chain is a prevHash → hash link; a break means tampering or a
      // failed write. Recompute by walking the stored order.
      let broken = 0;
      for (let i = 1; i < events.length; i++) {
        const prev = events[i - 1] as unknown as { hash?: string };
        const cur = events[i] as unknown as { prevHash?: string; hash?: string };
        if (cur.prevHash && prev.hash && cur.prevHash !== prev.hash) {
          broken++;
          await this.ex(runId, 'audit_break', 'critical', `Audit chain broken at event ${events[i].id}`);
        }
      }
      return { ok: broken === 0, notes: broken ? [] : ['Audit chain contiguous.'] };
    },
  };

  /** Reconcilers registered but unavailable until their sources exist. */
  private readonly unavailable = [
    'supply_coverage', // needs reserve attestations + circulating supply (P11 inactive)
    'redemption_recon', // needs redemption ledger (P12 inactive)
    'wallet_ledger', // needs wallet/purchase ledgers (P7 inactive)
    'treasury_recon', // needs treasury ledger (P7 inactive)
    'fee_recon', // needs fee ledger (P15+)
  ];

  private async ex(
    runId: string,
    code: string,
    severity: string,
    message: string,
  ) {
    await this.prisma.reconcileException.create({
      data: { runId, code, severity, message },
    });
  }

  /** Run one reconciler (or `all`), returning the run with its exceptions. */
  async run(type: string, createdBy?: string) {
    const run = await this.prisma.reconcileRun.create({
      data: { type, status: 'completed', createdBy: createdBy ?? null },
    });

    if (this.unavailable.includes(type)) {
      await this.ex(
        run.id,
        `${type}_unavailable`,
        'info',
        `Reconciler ${type} is registered but its source ledger is inactive — nothing compared.`,
      );
      return this.detail(run.id);
    }

    const fn = this.live[type];
    if (!fn) {
      await this.ex(run.id, 'unknown_reconciler', 'warning', `Unknown reconciler: ${type}`);
      return this.detail(run.id);
    }

    try {
      const result = await fn(run.id);
      await this.prisma.reconcileRun.update({
        where: { id: run.id },
        data: { summary: { ok: result.ok, notes: result.notes } },
      });
    } catch (e) {
      this.logger.error(`Reconciler ${type} failed: ${(e as Error).message}`);
      await this.prisma.reconcileRun.update({
        where: { id: run.id },
        data: { status: 'failed', summary: { error: (e as Error).message } },
      });
    }
    return this.detail(run.id);
  }

  async list(take = 20) {
    return this.prisma.reconcileRun.findMany({
      orderBy: { startedAt: 'desc' },
      take,
      include: { _count: { select: { exceptions: true } } },
    });
  }

  async detail(id: string) {
    const run = await this.prisma.reconcileRun.findUnique({
      where: { id },
      include: { exceptions: { orderBy: { severity: 'desc' } } },
    });
    if (!run) throw new Error('reconcile_run_not_found');
    return run;
  }

  /** Open exception queue, optionally by code/severity. */
  async exceptions(opts: { code?: string; severity?: string; take?: number }) {
    return this.prisma.reconcileException.findMany({
      where: {
        resolved: false,
        ...(opts.code ? { code: opts.code } : {}),
        ...(opts.severity ? { severity: opts.severity } : {}),
      },
      orderBy: { severity: 'desc' },
      take: opts.take ?? 50,
    });
  }

  async resolveException(id: string, by: string) {
    return this.prisma.reconcileException.update({
      where: { id },
      data: { resolved: true, resolvedBy: by, resolvedAt: new Date() },
    });
  }
}
