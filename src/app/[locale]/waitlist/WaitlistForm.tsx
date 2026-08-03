'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

export function WaitlistForm() {
  const t = useTranslations('waitlist');
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', organization: '', interest: '', investorType: '' });
  const [consent, setConsent] = useState({ notInvestment: false, notRestricted: false, privacy: false });
  const [status, setStatus] = useState('idle');
  // Honeypot + minimum-fill-time: cheap anti-spam that needs no captcha
  // provider (Screen Registry step 2 — captcha stays a future option).
  const [honey, setHoney] = useState('');
  const [t0] = useState(() => Date.now());
  const MIN_FILL_MS = 3500;

  const allConsent = consent.notInvestment && consent.notRestricted && consent.privacy;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email);
  // The API classifies every registration, so collect it rather than letting
  // every signup fall back to "other".
  const step1Ok = emailOk && !!form.investorType;

  async function submit() {
    // Bots fill the hidden field; humans never see it. Silently drop.
    if (honey) return;
    if (Date.now() - t0 < MIN_FILL_MS) {
      setStatus('error');
      return;
    }
    setStatus('saving');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, consent: allConsent, locale }),
      });
      // 429 is its own state: the form is fine, the visitor was too fast.
      // Every other failure shows the generic error.
      if (res.status === 429) setStatus('rate_limited');
      else setStatus(res.ok ? 'done' : 'error');
      if (res.ok) setStep(3);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="serif text-3xl">{t('title')}</h1>
      <p className="mt-2 text-sm text-text2">{t('subtitle')}</p>
      <div className="mt-6 flex gap-2 text-xs text-text2">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`flex-1 rounded-full border px-3 py-1 text-center ${step >= n ? 'border-copper text-copper' : 'border-border'}`}>
            {t(`steps.${n}`)}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="mt-8 space-y-4">
          {/* Honeypot — visually hidden, bots fill it, humans never see it. */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label>
              Company website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honey}
                onChange={(e) => setHoney(e.target.value)}
              />
            </label>
          </div>
          <Field label={t('f.name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label={t('f.email')} value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" required />
          <label className="block">
            <span className="mb-1 block text-xs text-text2">{t('f.type')} *</span>
            <select
              value={form.investorType}
              onChange={(e) => setForm({ ...form, investorType: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-copper"
            >
              <option value="">{t('f.typePlaceholder')}</option>
              <option value="institution">{t('types.institution')}</option>
              <option value="investor">{t('types.investor')}</option>
              <option value="partner">{t('types.partner')}</option>
              <option value="other">{t('types.other')}</option>
            </select>
          </label>
          <Field label={t('f.org')} value={form.organization} onChange={(v) => setForm({ ...form, organization: v })} />
          <Field label={t('f.interest')} value={form.interest} onChange={(v) => setForm({ ...form, interest: v })} />
          <button disabled={!step1Ok} onClick={() => setStep(2)} className="rounded-lg bg-copperDeep px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">
            {t('next')}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8 space-y-4">
          <div className="rounded-lg border border-danger/40 bg-danger/5 px-4 py-3 text-xs text-text2">{t('eligibilityNotice')}</div>
          <Check label={t('c.notInvestment')} checked={consent.notInvestment} onChange={(v) => setConsent({ ...consent, notInvestment: v })} />
          <Check label={t('c.notRestricted')} checked={consent.notRestricted} onChange={(v) => setConsent({ ...consent, notRestricted: v })} />
          <Check label={t('c.privacy')} checked={consent.privacy} onChange={(v) => setConsent({ ...consent, privacy: v })} />
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="rounded-lg border border-border px-5 py-2.5 text-sm">{t('back')}</button>
            <button disabled={!allConsent || status === 'saving'} onClick={submit} className="rounded-lg bg-copperDeep px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">
              {status === 'saving' ? t('saving') : t('submit')}
            </button>
          </div>
          {status === 'rate_limited' && <p className="text-xs text-danger">{t('rateLimited')}</p>}
          {status === 'error' && <p className="text-xs text-danger">{t('error')}</p>}
        </div>
      )}

      {step === 3 && (
        <div className="mt-10 rounded-xl border border-ok/40 bg-ok/5 p-6 text-center">
          <div className="text-3xl">✓</div>
          <h2 className="serif mt-2 text-xl">{t('done.title')}</h2>
          <p className="mt-1 text-sm text-text2">{t('done.body')}</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-text2">{label}{required && ' *'}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-copper" />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1" />
      <span className="text-text2">{label}</span>
    </label>
  );
}
