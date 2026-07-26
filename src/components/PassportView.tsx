import type { PublicPassport } from "@/lib/cms";

export type PassportLabels = {
  programLabel: string;
  metalLabel: string;
  purityLabel: string;
  stageLabel: string;
  provenance: string;
  tokenMapping: string;
  tokenInactive: string;
  contractAddress: string;
  circulatingSupply: string;
  disclosureHeading: string;
  metal: string;
  stage: string;
};

/**
 * Presentational Digital Asset Passport. Pure server component — receives the
 * passport plus already-localized label strings, so it holds no i18n logic.
 */
export default function PassportView({
  passport,
  labels,
}: {
  passport: PublicPassport;
  labels: PassportLabels;
}) {
  const { program, highlights, tokenMapping, disclosure } = passport;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-neutral-400">
          {labels.programLabel}: {program.title}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-neutral-100">
          {passport.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-300">
            {labels.metalLabel}: {labels.metal}
          </span>
          {program.purity ? (
            <span className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-300">
              {labels.purityLabel}: {program.purity}
            </span>
          ) : null}
          <span className="rounded-full border border-neutral-700 px-3 py-1 text-neutral-300">
            {labels.stageLabel}: {labels.stage}
          </span>
        </div>
      </header>

      {highlights.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium text-neutral-200">
            {labels.provenance}
          </h2>
          <dl className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {highlights.map((h, i) => (
              <div key={i} className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-neutral-400">{h.label}</dt>
                <dd className="text-right font-medium text-neutral-100">
                  {h.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-neutral-200">
          {labels.tokenMapping}
        </h2>
        {tokenMapping ? (
          <dl className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            <div className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-neutral-400">{labels.contractAddress}</dt>
              <dd className="break-all text-right font-mono text-sm text-neutral-100">
                {tokenMapping.contractAddress || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-neutral-400">{labels.circulatingSupply}</dt>
              <dd className="text-right font-medium text-neutral-100">
                {tokenMapping.circulatingSupply ?? "—"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
            {labels.tokenInactive}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          {labels.disclosureHeading}
        </h2>
        <p className="text-sm leading-relaxed text-neutral-400">{disclosure}</p>
      </section>
    </article>
  );
}
