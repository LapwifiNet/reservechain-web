import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ReserveChain.io — Tokenized Industrial Metals (In Development)',
  description: 'Institutional infrastructure for tokenized industrial-metal reserves. In development — no tokens are offered or sold.',
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
          <Nav />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
