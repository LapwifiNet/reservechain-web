import { useTranslations } from 'next-intl';
import { StatusTag } from './StatusTag';
import {
  STATUS_AXES,
  statusLabelKey,
  statusTone,
  type ProjectStatus,
} from '@/lib/status';

/**
 * StatusChips slot — the three D5 chips (publication / token / asset).
 *
 * The caller resolves the state from the CMS (`projectStatusFromCms()`); this
 * component only renders it. Every visible string comes from the `status`
 * message namespace keyed by the enum, never from the CMS: the state is data,
 * the wording is reviewed content in three locales (guardrails 3 and 6).
 *
 * `asOf` is rendered when supplied so a chip is never a claim without a date
 * attached — "Independently verified" with no "as of" reads as permanent.
 */
export function StatusChips({
  status,
  asOf,
}: {
  status: ProjectStatus;
  asOf?: string;
}) {
  const t = useTranslations('status');
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">
        {t('heading')}
      </div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        {STATUS_AXES.map((axis) => (
          <div key={axis}>
            <dt className="text-xs text-text2">{t(`axis.${axis}`)}</dt>
            <dd className="mt-1.5">
              <StatusTag kind={statusTone(axis, status[axis])}>
                {t(statusLabelKey(axis, status[axis]))}
              </StatusTag>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-text2">
        {asOf ? t('asOf', { date: asOf }) : null} {t('note')}
      </p>
    </div>
  );
}
