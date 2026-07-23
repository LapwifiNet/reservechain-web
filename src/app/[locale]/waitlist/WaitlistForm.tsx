'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

export function WaitlistForm() {
  const t = useTranslations('waitlist');
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', organization: '', interest: '' });
  const [consent, setConsent] = useState({ notInvestment: false, notRestricted: false, privacy: false });
  const [status, setStatus] = useState('idle');

  const allConsent = consent.notInvestment && consent.notRestricted && consent.privacy;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email);

  async function submit() {
    setStatus('saving');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, consent: allConsent, locale }),
      });
      setStatus(res.ok ? 'done' : 'error');
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
          <Field label={t('f.name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label={t('f.email')} value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" required />
          <Field label={t('f.org')} value={form.organization} onChange={(v) => setForm({ ...form, organization: v })} />
          <Field label={t('f.interest')} value={form.interest} onChange={(v) => setForm({ ...form, interest: v })} />
          <button disabled={!emailOk} onClick={() => setStep(2)} className="rounded-lg bg-copper px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">
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
            <button disabled={!allConsent || status === 'saving'} onClick={submit} className="rounded-lg bg-copper px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">
              {status === 'saving' ? t('saving') : t('submit')}
            </button>
          </div>
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

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-text2">{label}{required && ' *'}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-copper" />
    </label>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1" />
      <span className="text-text2">{label}</span>
    </label>
  );
}
