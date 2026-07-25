import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { PageHeader } from '@/components/PageHeader';
import { Disclosure } from '@/components/Disclosure';
import { StatusTag } from '@/components/StatusTag';
import { pageMetadata } from '@/lib/meta';
import { documentIndex, type DocState } from '@/lib/documents';

export const generateMetadata = pageMetadata('documents');

const stateKind: Record<DocState, string | undefined> = {
  published: undefined,
  preparation: 'illustrative',
  pending: undefined,
};

export default function DocumentsPage() {
  const t = useTranslations('page.documents');

  return (
    <div className="mx-auto max-w-content px-5">
      <PageHeader kicker={t('kicker')} title={t('title')} intro={t('intro')} />

      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-text2">{t('note')}</p>

      <div className="mt-8 space-y-10">
        {documentIndex.map((section) => (
          <section key={section.group}>
            <h2 className="serif text-xl">{t(`group.${section.group}`)}</h2>
            <ul className="mt-4 divide-y divide-border/60 overflow-hidden rounded-xl border border-border">
              {section.items.map((doc) => (
                <li key={doc.key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                  <span className="text-sm">
                    {doc.href ? (
                      <Link href={doc.href} className="text-brand hover:underline">
                        {t(`doc.${doc.key}`)}
                      </Link>
                    ) : (
                      <span className="text-text2">{t(`doc.${doc.key}`)}</span>
                    )}
                  </span>
                  <StatusTag kind={stateKind[doc.state]}>{t(`state.${doc.state}`)}</StatusTag>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="py-10">
        <Disclosure variant="full" />
      </div>
    </div>
  );
}
