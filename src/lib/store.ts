import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

// Waitlist store with two backends, selected at runtime:
//   - PostgreSQL when DATABASE_URL is set (production: Vercel Postgres, Neon, Supabase, ...)
//   - JSON file otherwise (local development only; NOT persistent on Vercel)
export type WaitlistEntry = {
  id: string;
  email: string;
  name?: string;
  organization?: string;
  interest?: string;
  locale: string;
  createdAt: string;
};

const useDb = !!process.env.DATABASE_URL;

// ----- PostgreSQL backend -----
let pool: any = null;
let ready: Promise<void> | null = null;

async function getPool() {
  if (!pool) {
    const { Pool } = await import('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
    });
    ready = pool
      .query(`
        CREATE TABLE IF NOT EXISTS waitlist (
          id           text PRIMARY KEY,
          email        text NOT NULL,
          name         text,
          organization text,
          interest     text,
          locale       text NOT NULL DEFAULT 'en',
          created_at   timestamptz NOT NULL DEFAULT now()
        );
      `)
      .then(() => undefined);
  }
  if (ready) await ready;
  return pool;
}

// ----- JSON file backend (local dev) -----
const DATA_DIR = process.env.WAITLIST_DIR
  ? process.env.WAITLIST_DIR
  : process.env.VERCEL
    ? path.join(os.tmpdir(), 'reservechain-waitlist')
    : path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'waitlist.json');

async function readFileAll(): Promise<WaitlistEntry[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as WaitlistEntry[];
  } catch {
    return [];
  }
}

function newId() {
  return `wl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function addEntry(e: Omit<WaitlistEntry, 'id' | 'createdAt'>): Promise<WaitlistEntry> {
  const entry: WaitlistEntry = { ...e, id: newId(), createdAt: new Date().toISOString() };
  if (useDb) {
    const p = await getPool();
    await p.query(
      'INSERT INTO waitlist (id, email, name, organization, interest, locale, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [entry.id, entry.email, entry.name ?? null, entry.organization ?? null, entry.interest ?? null, entry.locale, entry.createdAt],
    );
    return entry;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const all = await readFileAll();
  all.push(entry);
  await fs.writeFile(FILE, JSON.stringify(all, null, 2), 'utf8');
  return entry;
}

export async function listEntries(): Promise<WaitlistEntry[]> {
  if (useDb) {
    const p = await getPool();
    const r = await p.query(
      'SELECT id, email, name, organization, interest, locale, created_at AS "createdAt" FROM waitlist ORDER BY created_at DESC LIMIT 500',
    );
    return r.rows as WaitlistEntry[];
  }
  return readFileAll();
}

export async function countEntries(): Promise<number> {
  if (useDb) {
    const p = await getPool();
    const r = await p.query('SELECT COUNT(*)::int AS n FROM waitlist');
    return r.rows[0]?.n ?? 0;
  }
  return (await readFileAll()).length;
}
