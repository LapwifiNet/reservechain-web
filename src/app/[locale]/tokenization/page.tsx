import { InfoPage } from '@/components/InfoPage';
import { SpecTable } from '@/components/SpecTable';
import { pageMetadata } from '@/lib/meta';
import { getTranslations } from 'next-intl/server';

export const generateMetadata = pageMetadata('tokenization');

type Block = { h: string; p: string; li?: string[] };

/**
 * SC-WEB-TOKENIZE — the "Configurable parameters" block renders as a
 * SpecTable slot: every parameter row carries an unset/pending value, never a
 * fabricated figure (FR-TOK-1: no hard-coded supply/price/ratio).
 */
export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'page.tokenization' });
  const blocks = t.raw('s') as Block[];

  const paramsBlock = blocks.find((b) =>
    b.h.toLowerCase().includes('configurable'),
  );
  const rows = (paramsBlock?.li ?? []).map((item) => {
    const [label, ...rest] = item.split(' — ');
    const status = rest.length ? rest.join(' — ') : 'Pending';
    return { k: label, v: status };
  });

  return (
    <InfoPage ns="tokenization" notice="proposed">
      {rows.length ? <SpecTable rows={rows} /> : null}
    </InfoPage>
  );
}
