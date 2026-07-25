import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { mainNav } from '@/lib/nav';
import LocaleSwitcher from './LocaleSwitcher';

/**
 * Primary navigation — the 16 items required by FR-WEB-1, grouped into four
 * menus plus Home. Desktop menus open on hover and on keyboard focus (the panel
 * stays in the accessibility tree via `invisible`, not `hidden`, so its links
 * remain tabbable). Mobile uses a native <details> accordion, which keeps the
 * whole header a server component with no client-side JavaScript.
 */
export default function Nav() {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/" className="shrink-0 font-semibold tracking-tight">
          Reserve<span className="text-copper">Chain</span>.io
        </Link>

        <nav aria-label={t('primary')} className="hidden items-center gap-1 lg:flex">
          <Link href="/" className="rounded-lg px-3 py-2 text-sm text-text2 hover:text-text">
            {t('home')}
          </Link>

          {mainNav.map((group) => (
            <div key={group.key} className="group relative">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-text2 hover:text-text group-focus-within:text-text"
              >
                {t(`group.${group.key}`)}
                <svg viewBox="0 0 10 6" aria-hidden="true" className="h-1.5 w-2.5 fill-current opacity-60">
                  <path d="M0 0h10L5 6z" />
                </svg>
              </button>
              <div className="invisible absolute left-0 top-full min-w-[260px] pt-1 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <ul className="rounded-xl border border-border bg-surface p-2 shadow-lg shadow-black/30">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block rounded-lg px-3 py-2 text-sm text-text2 hover:bg-surface2 hover:text-text"
                      >
                        {t(item.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <LocaleSwitcher />
          <Link
            href="/waitlist"
            className="hidden rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white hover:brightness-110 sm:inline-block"
          >
            {t('cta')}
          </Link>
        </div>
      </div>

      <details className="border-t border-border lg:hidden">
        <summary className="cursor-pointer px-5 py-3 text-sm text-text2">{t('menu')}</summary>
        <nav aria-label={t('primary')} className="border-t border-border/60 px-5 pb-5 pt-2">
          <Link href="/" className="block py-2 text-sm text-text2">
            {t('home')}
          </Link>
          {mainNav.map((group) => (
            <div key={group.key} className="mt-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">
                {t(`group.${group.key}`)}
              </div>
              <ul className="mt-1">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="block py-2 text-sm text-text2">
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link
            href="/waitlist"
            className="mt-4 inline-block rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white"
          >
            {t('cta')}
          </Link>
        </nav>
      </details>
    </header>
  );
}
