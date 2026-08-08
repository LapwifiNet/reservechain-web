import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { robotsFor, siteUrl } from '@/lib/seo';
import Nav from '@/components/Nav';
import SkipLink from '@/components/SkipLink';
import { ModeBanner } from '@/components/ModeBanner';
import Footer from '@/components/Footer';
import '@/styles/globals.css';

// Inherited by any route that does not set its own. `robots` is repeated per
// page rather than left to inheritance alone, because a page that builds its
// own `robots` field would otherwise replace this one silently; the default
// here is what covers /_not-found and anything added without metadata.
export const metadata: Metadata = {
  title: 'OpenRWA.io — Tokenized Industrial Metals (In Development)',
  description: 'Institutional infrastructure for tokenized industrial-metal reserves. In development — no tokens are offered or sold.',
  ...(siteUrl() ? { metadataBase: new URL(siteUrl()!) } : {}),
  robots: robotsFor(''),
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Params convention: take `params` whole and read fields in the body, never
// destructure it in the signature — Next 15+ passes a Promise, so the upgrade
// is then a one-line `const { locale } = await params;` here.
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!routing.locales.includes(locale as any)) notFound();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <SkipLink />
          <ModeBanner />
          <Nav />
          <main id="main-content">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
