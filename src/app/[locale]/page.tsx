import { useTranslations } from 'next-intl';
import { Button } from '@/components/Button';
import { Disclosure } from '@/components/Disclosure';

export default function Home() {
  const t = useTranslations('home');
  const trust = [t('trust.0'), t('trust.1'), t('trust.2'), t('trust.3')];
  const steps = [
    { icon: '\u{1F4E6}', k: 'register' },
    { icon: '\u{1F50E}', k: 'verify' },
    { icon: '\u{1FA99}', k: 'tokenize' },
  ];
  return (
    <div className="mx-auto max-w-content px-5">
      <section className="py-16 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-copper">{t('kicker')}</div>
        <h1 className="serif mx-auto mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">{t('title')}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-text2">{t('subtitle')}</p>
        <p className="mt-3 text-xs text-text2/70">{t('note')}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button href="/waitlist" variant="primary">{t('cta.primary')}</Button>
          <Button href="/copper-powder" variant="ghost">{t('cta.model')}</Button>
          <Button href="/nickel-wire" variant="ghost">{t('cta.programs')}</Button>
          <Button href="/waitlist" variant="outline">{t('cta.enterprise')}</Button>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-y border-border py-4 text-xs text-text2">
        {trust.map((x) => (
          <span key={x} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-copper" />{x}</span>
        ))}
      </section>

      <section className="py-10"><Disclosure variant="full" /></section>

      <section className="pb-12">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">{t('hiw.kicker')}</div>
        <h2 className="serif mt-2 text-2xl">{t('hiw.title')}</h2>
        <p className="mt-1 text-sm text-text2">{t('hiw.subtitle')}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.k} className="rounded-xl border border-border bg-surface/50 p-5">
              <div className="text-2xl">{s.icon}</div>
              <h3 className="mt-3 font-medium">{t(`hiw.${s.k}.title`)}</h3>
              <p className="mt-1 text-sm text-text2">{t(`hiw.${s.k}.body`)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
