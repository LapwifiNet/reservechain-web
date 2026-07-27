/**
 * Thin client for the ReserveChain CMS (Payload) public API. Reads published
 * Digital Asset Passports. Server-side only — do not import into client
 * components. Base URL defaults to the local CMS; override with CMS_API_BASE.
 *
 * CMS_API_BASE is deliberately not NEXT_PUBLIC_: the browser never talks to the
 * CMS, the same rule WAITLIST_API_BASE follows. No credential is sent — the
 * endpoints read here are the CMS's public, published-only surface.
 */
const CMS_API_BASE = process.env.CMS_API_BASE || "http://127.0.0.1:3001/api";

/** Hard ceiling on a CMS call, so an unreachable CMS cannot stall a render. */
const CMS_TIMEOUT_MS = 5_000;

/**
 * Fetch options for every CMS read.
 *
 * The try/catch at each call site reads as graceful degradation, but on its
 * own it was not: with the CMS unreachable the first `/passports` render
 * blocked for over ninety seconds before falling through to the empty state.
 * A bare fetch to that same refused port rejects in ~45ms, so the delay came
 * from Next's data cache retrying underneath `next: { revalidate }` — a path
 * that also ignores `signal`, which is why an AbortSignal alone did not bound
 * it, and racing the promise only made the render return early while the
 * losing fetch rejected later and tore the response stream.
 *
 * `cache: 'no-store'` keeps the request out of that layer entirely, so the
 * rejection lands in the catch where it belongs and the signal is honoured.
 * Nothing is lost: both callers declare `export const revalidate = 300`, so
 * the rendered page is still cached — this only stops it being cached twice.
 */
const cmsFetchInit = (): RequestInit => ({
  cache: "no-store",
  signal: AbortSignal.timeout(CMS_TIMEOUT_MS),
});

export type PublicPassport = {
  slug: string;
  title: string;
  stage: string;
  program: {
    title: string | null;
    code: string | null;
    metal: string | null;
    purity: string | null;
    stage: string | null;
  };
  highlights: Array<{ label: string; value: string }>;
  tokenMapping: {
    contractAddress: string | null;
    circulatingSupply: number | null;
  } | null;
  disclosure: string;
};

/** A row of the CMS list response at depth=1, where `program` is populated. */
type PassportListDoc = {
  slug: string;
  title: string;
  stage: string;
  program?: { metal?: string | null; purity?: string | null } | null;
};

export type PassportSummary = {
  slug: string;
  title: string;
  stage: string;
  metal: string | null;
  purity: string | null;
};

/**
 * Fetch a single published passport by slug, or null if it is unavailable.
 *
 * Returns null rather than throwing on a CMS error or an unreachable CMS. The
 * overlay threw on any non-404, which turns a CMS outage into a 500 on a public
 * marketing page; the caller renders notFound() instead, matching listPassports
 * below, which already swallowed its failures. Nothing here is a security
 * boundary — the CMS decides what is published — so failing closed to "no
 * passport" is the honest degradation.
 */
export async function getPassport(
  slug: string,
): Promise<PublicPassport | null> {
  try {
    const res = await fetch(
      `${CMS_API_BASE}/passports/public/${encodeURIComponent(slug)}`,
      cmsFetchInit(),
    );
    if (!res.ok) return null;
    return (await res.json()) as PublicPassport;
  } catch {
    return null;
  }
}

/** List published passports for the index page. Returns [] on any failure. */
export async function listPassports(): Promise<PassportSummary[]> {
  const url =
    `${CMS_API_BASE}/passports` +
    `?where[status][equals]=published&depth=1&limit=100&sort=title`;
  try {
    const res = await fetch(url, cmsFetchInit());
    if (!res.ok) return [];
    const data = (await res.json()) as { docs?: PassportListDoc[] };
    return (data.docs || []).map((d) => ({
      slug: d.slug,
      title: d.title,
      stage: d.stage,
      metal: d.program?.metal ?? null,
      purity: d.program?.purity ?? null,
    }));
  } catch {
    return [];
  }
}
