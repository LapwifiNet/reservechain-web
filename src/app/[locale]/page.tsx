import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/Button';
import { Disclosure } from '@/components/Disclosure';
import { Section, Card, CardGrid } from '@/components/Section';
import { StatusTag } from '@/components/StatusTag';

/**
 * Home page — the 22 sections required by FR-WEB-2, in the order set by the
 * brief: hero, disclosure, model, workflow, Copper, Nickel, illustrative asset,
 * verification, custody, PoR, legal structure, ERC-20, redemption, enterprise,
 * asset-owner, risks, documents, FAQ, waitlist, corporate status, contact,
 * anti-fraud. Each section is a short overview that routes to its own page, so
 * the home page stays an index rather than duplicating the detail copy.
 */
export default function Home() {
  const t = useTranslations('home');
  const s = useTranslations('home.s');
  const more = t('more');

  const trust = [t('trust.0'), t('trust.1'), t('trust.2'), t('trust.3')];
  const raw = (key: string) => s.raw(key) as { h: string; p: string }[];
  const list = (key: string) => s.raw(key) as string[];

  return (
    <div className="mx-auto max-w-content px-5">
      {/* 1 — Hero */}
      <section id="hero" className="scroll-mt-24 py-16 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-copper">{t('kicker')}</div>
        <h1 className="serif mx-auto mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">{t('title')}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-text2">{t('subtitle')}</p>
        <p className="mt-3 text-xs text-text2/70">{t('note')}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button href="/waitlist" variant="primary">
            {t('cta.primary')}
          </Button>
          <Button href="/how-it-works" variant="ghost">
            {t('cta.model')}
          </Button>
          <Button href="/industrial-metal-assets" variant="ghost">
            {t('cta.programs')}
          </Button>
          <Button href="/enterprise" variant="outline">
            {t('cta.enterprise')}
          </Button>
        </div>
      </section>

      {/* Trust bar */}
      <section className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-y border-border py-4 text-xs text-text2">
        {trust.map((x) => (
          <span key={x} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-copper" />
            {x}
          </span>
        ))}
      </section>

      {/* 2 — Mandatory verbatim disclosure (CR-3) */}
      <section id="disclosure" className="scroll-mt-24 py-10">
        <Disclosure variant="full" />
      </section>

      {/* 3 — Proposed model */}
      <Section id="model" kicker={s('model.kicker')} title={s('model.title')} subtitle={s('model.body')}>
        <CardGrid>
          {raw('model.items').map((c) => (
            <Card key={c.h} title={c.h}>
              {c.p}
            </Card>
          ))}
        </CardGrid>
      </Section>

      {/* 4 — Workflow */}
      <Section id="workflow" kicker={s('workflow.kicker')} title={s('workflow.title')} subtitle={s('workflow.body')}>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {raw('workflow.items').map((step, i) => (
            <li key={step.h} className="rounded-xl border border-border bg-surface/50 p-5">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-copper">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-2 font-medium">{step.h}</h3>
              <p className="mt-1 text-sm text-text2">{step.p}</p>
            </li>
          ))}
        </ol>
        <Link href="/how-it-works" className="mt-6 inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 5 — Copper Powder */}
      <Section id="copper" kicker={s('copper.kicker')} title={s('copper.title')} subtitle={s('copper.body')}>
        <Link href="/copper-powder" className="inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 6 — Nickel Wire */}
      <Section id="nickel" kicker={s('nickel.kicker')} title={s('nickel.title')} subtitle={s('nickel.body')}>
        <Link href="/nickel-wire" className="inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 7 — Illustrative asset / sample passport */}
      <Section id="passport" kicker={s('passport.kicker')} title={s('passport.title')} subtitle={s('passport.body')}>
        <div className="rounded-xl border border-border bg-surface/50 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm">DAP-0001</span>
            <StatusTag kind="illustrative">{s('passport.tagIllustrative')}</StatusTag>
            <StatusTag>{s('passport.tagReserve')}</StatusTag>
            <StatusTag kind="notissued">{s('passport.tagToken')}</StatusTag>
          </div>
          <p className="mt-4 text-sm text-text2">{s('passport.note')}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/passport/DAP-0001" variant="ghost">
              {s('passport.cta')}
            </Button>
            <Button href="/registry" variant="ghost">
              {s('passport.ctaRegistry')}
            </Button>
          </div>
        </div>
      </Section>

      {/* 8 — Verification */}
      <Section id="verification" kicker={s('verification.kicker')} title={s('verification.title')} subtitle={s('verification.body')}>
        <Bullets items={list('verification.items')} />
        <Link href="/verification" className="mt-6 inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 9 — Custody */}
      <Section id="custody" kicker={s('custody.kicker')} title={s('custody.title')} subtitle={s('custody.body')}>
        <Bullets items={list('custody.items')} />
        <Link href="/custody" className="mt-6 inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 10 — Proof of Reserves */}
      <Section id="proof-of-reserves" kicker={s('por.kicker')} title={s('por.title')} subtitle={s('por.body')}>
        <div className="mb-5">
          <StatusTag>{s('inactiveTag')}</StatusTag>
        </div>
        <Bullets items={list('por.items')} />
        <Link href="/proof-of-reserves" className="mt-6 inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 11 — Legal and asset-holding structure */}
      <Section id="legal-structure" kicker={s('legal.kicker')} title={s('legal.title')} subtitle={s('legal.body')}>
        <Bullets items={list('legal.items')} />
        <Link href="/legal-structure" className="mt-6 inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 12 — ERC-20 architecture */}
      <Section id="tokenization" kicker={s('erc20.kicker')} title={s('erc20.title')} subtitle={s('erc20.body')}>
        <div className="mb-5">
          <StatusTag kind="notissued">{s('erc20.tag')}</StatusTag>
        </div>
        <Bullets items={list('erc20.items')} />
        <Link href="/tokenization" className="mt-6 inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 13 — Redemption */}
      <Section id="redemption" kicker={s('redemption.kicker')} title={s('redemption.title')} subtitle={s('redemption.body')}>
        <div className="mb-5">
          <StatusTag>{s('inactiveTag')}</StatusTag>
        </div>
        <Link href="/redemption" className="inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 14 — Enterprise services */}
      <Section id="enterprise" kicker={s('enterprise.kicker')} title={s('enterprise.title')} subtitle={s('enterprise.body')}>
        <Bullets items={list('enterprise.items')} />
        <Link href="/enterprise" className="mt-6 inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 15 — Asset owners and originators */}
      <Section id="asset-owner" kicker={s('assetOwner.kicker')} title={s('assetOwner.title')} subtitle={s('assetOwner.body')}>
        <div className="flex flex-wrap gap-3">
          <Button href="/asset-owner-enquiries" variant="ghost">
            {s('assetOwner.cta')}
          </Button>
          <Button href="/industrial-buyer-enquiries" variant="ghost">
            {s('assetOwner.ctaBuyer')}
          </Button>
        </div>
      </Section>

      {/* 16 — Risks */}
      <Section id="risks" kicker={s('risks.kicker')} title={s('risks.title')} subtitle={s('risks.body')}>
        <div className="rounded-xl border border-danger/40 bg-danger/5 p-6">
          <Bullets items={list('risks.items')} tone="danger" />
        </div>
        <Link href="/risk-disclosure" className="mt-6 inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 17 — Documents and resources */}
      <Section id="documents" kicker={s('documents.kicker')} title={s('documents.title')} subtitle={s('documents.body')}>
        <Link href="/documents" className="inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 18 — FAQ */}
      <Section id="faq" kicker={s('faq.kicker')} title={s('faq.title')}>
        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border">
          {raw('faq.items').map((q) => (
            <details key={q.h} className="group">
              <summary className="cursor-pointer px-5 py-4 text-sm font-medium">{q.h}</summary>
              <p className="px-5 pb-4 text-sm text-text2">{q.p}</p>
            </details>
          ))}
        </div>
        <Link href="/faq" className="mt-6 inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 19 — Waitlist */}
      <Section id="waitlist">
        <div className="rounded-xl border border-border bg-surface/50 p-8 text-center">
          <h2 className="serif text-2xl">{s('waitlist.title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-text2">{s('waitlist.body')}</p>
          <div className="mt-6">
            <Button href="/waitlist">{s('waitlist.cta')}</Button>
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-xs text-text2/80">{s('waitlist.note')}</p>
        </div>
      </Section>

      {/* 20 — Corporate development status */}
      <Section id="corporate-status" kicker={s('status.kicker')} title={s('status.title')} subtitle={s('status.body')}>
        <CardGrid cols={2}>
          <Card title={s('status.inDevTitle')}>
            <Bullets items={list('status.inDev')} />
          </Card>
          <Card title={s('status.notYetTitle')}>
            <Bullets items={list('status.notYet')} tone="danger" />
          </Card>
        </CardGrid>
        <Link href="/corporate-status" className="mt-6 inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 21 — Contact */}
      <Section id="contact" kicker={s('contact.kicker')} title={s('contact.title')} subtitle={s('contact.body')}>
        <Link href="/contact" className="inline-block text-sm text-brand hover:underline">
          {more} →
        </Link>
      </Section>

      {/* 22 — Anti-fraud and anti-impersonation */}
      <Section id="anti-fraud" kicker={s('fraud.kicker')} title={s('fraud.title')} subtitle={s('fraud.body')}>
        <div className="rounded-xl border border-danger/40 bg-danger/5 p-6">
          <Bullets items={list('fraud.items')} tone="danger" />
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/anti-fraud" className="text-sm text-brand hover:underline">
            {more} →
          </Link>
          <Link href="/official-channels" className="text-sm text-brand hover:underline">
            {s('fraud.ctaChannels')} →
          </Link>
        </div>
      </Section>
    </div>
  );
}

function Bullets({ items, tone }: { items: string[]; tone?: 'danger' }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm text-text2">
          <span className={`mt-2 h-1 w-1 shrink-0 rounded-full ${tone === 'danger' ? 'bg-danger' : 'bg-copper'}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
