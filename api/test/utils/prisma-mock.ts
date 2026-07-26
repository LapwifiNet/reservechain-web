/**
 * In-memory stand-in for PrismaService used by the mocked e2e suite. It
 * implements the small slice of the Prisma delegate API that the investor /
 * kyc / audit code actually calls, so those tests run without a live Postgres
 * database.
 *
 * Adapted from the p8tests overlay for the current backend:
 * - the audit model is `auditEvent` (hash-chained), not the overlay's
 *   `auditLog`;
 * - `$transaction` (interactive callback form) and `$executeRaw` exist because
 *   AuditService.record() serialises the chain link inside a transaction that
 *   takes a pg advisory lock — a no-op here, where Jest is single-threaded;
 * - `findMany` supports `skip` (used by the audit list endpoint).
 */

type Row = Record<string, any>;
type Where = Record<string, any> | undefined;
type OrderBy = Record<string, 'asc' | 'desc'> | undefined;

let counter = 0;
const genId = (prefix: string) => `${prefix}_${(++counter).toString(36)}`;

function matchWhere(row: Row, where: Where): boolean {
  if (!where) return true;
  return Object.entries(where).every(([k, v]) => row[k] === v);
}

function applyOrder(rows: Row[], orderBy: OrderBy): Row[] {
  if (!orderBy) return rows;
  const [field, dir] = Object.entries(orderBy)[0];
  return [...rows].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === 'desc' ? -cmp : cmp;
  });
}

export type ModelName =
  | 'investorUser'
  | 'waitlistEntry'
  | 'kycCase'
  | 'assetProgram'
  | 'auditEvent'
  | 'adminUser';

export function createPrismaMock() {
  const db: Record<ModelName, Row[]> = {
    investorUser: [],
    waitlistEntry: [],
    kycCase: [],
    assetProgram: [],
    auditEvent: [],
    adminUser: [],
  };

  // A monotonically increasing clock so createdAt ordering is deterministic
  // even when many rows are created within the same millisecond.
  let clock = 1;

  const delegate = (key: ModelName) => ({
    findUnique: async ({ where }: { where: Where }) =>
      db[key].find((r) => matchWhere(r, where)) ?? null,

    findFirst: async ({
      where,
      orderBy,
    }: { where?: Where; orderBy?: OrderBy } = {}) => {
      const rows = applyOrder(
        db[key].filter((r) => matchWhere(r, where)),
        orderBy,
      );
      return rows[0] ? { ...rows[0] } : null;
    },

    findMany: async ({
      where,
      orderBy,
      skip,
      take,
    }: {
      where?: Where;
      orderBy?: OrderBy;
      skip?: number;
      take?: number;
    } = {}) => {
      let rows = applyOrder(
        db[key].filter((r) => matchWhere(r, where)),
        orderBy,
      );
      if (typeof skip === 'number') rows = rows.slice(skip);
      if (typeof take === 'number') rows = rows.slice(0, take);
      return rows.map((r) => ({ ...r }));
    },

    create: async ({ data }: { data: Row }) => {
      const row: Row = {
        id: data.id ?? genId(key),
        createdAt: clock++,
        updatedAt: clock,
        ...data,
      };
      db[key].push(row);
      return { ...row };
    },

    update: async ({ where, data }: { where: Where; data: Row }) => {
      const row = db[key].find((r) => matchWhere(r, where));
      if (!row) throw new Error(`${key}_record_not_found`);
      Object.assign(row, data, { updatedAt: clock++ });
      return { ...row };
    },

    count: async ({ where }: { where?: Where } = {}) =>
      db[key].filter((r) => matchWhere(r, where)).length,

    // Minimal groupBy: single field + _count._all (what KycService.stats uses).
    groupBy: async ({ by }: { by: string[]; _count?: unknown }) => {
      const field = by[0];
      const groups = new Map<any, number>();
      for (const r of db[key]) {
        groups.set(r[field], (groups.get(r[field]) ?? 0) + 1);
      }
      return [...groups.entries()].map(([value, n]) => ({
        [field]: value,
        _count: { _all: n },
      }));
    },
  });

  const mock = {
    investorUser: delegate('investorUser'),
    waitlistEntry: delegate('waitlistEntry'),
    kycCase: delegate('kycCase'),
    assetProgram: delegate('assetProgram'),
    auditEvent: delegate('auditEvent'),
    adminUser: delegate('adminUser'),

    // Interactive-callback transactions run against the mock itself; the
    // advisory lock inside becomes a no-op via $executeRaw below.
    $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
      fn(mock),
    $executeRaw: async (..._args: unknown[]) => 0,

    // Test helpers (not part of the Prisma API).
    _db: db,
    _seed(model: ModelName, rows: Row[]) {
      for (const r of rows) {
        db[model].push({ createdAt: clock++, updatedAt: clock, ...r });
      }
    },

    // Lifecycle no-ops so Nest can call PrismaService hooks safely.
    $connect: async () => {},
    $disconnect: async () => {},
    onModuleInit: async () => {},
    onModuleDestroy: async () => {},
    enableShutdownHooks: async () => {},
  };

  return mock;
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;
