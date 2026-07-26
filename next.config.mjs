import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle so the Docker runtime stage needs only
  // .next/standalone instead of the full node_modules tree.
  output: 'standalone',

  async redirects() {
    return [
      // The old /passport/:id route rendered hardcoded per-unit content with no
      // data source and was retired. Its ids were arbitrary illustrative
      // registry identifiers (DAP-0001 …) with no counterpart in the CMS, whose
      // passports are program-level and slugged from their titles
      // (copper-powder-passport), so there is no id-to-slug mapping to preserve
      // — every old URL lands on the index. Permanent, because these URLs were
      // linked from the nav, the home page and the registry table, and may be
      // indexed.
      //
      // Only the locale-prefixed form is redirected. The i18n middleware
      // matches '/' and '/(en|es|it)/:path*' only, so an unprefixed
      // /passport/DAP-0001 has always 404'd exactly as /registry and /waitlist
      // do today — it was never a live URL and cannot have been indexed as one.
      // Adding a rule for it would replace a clean 404 with a 308 into a 404.
      {
        source: '/:locale(en|es|it)/passport/:path*',
        destination: '/:locale/passports',
        permanent: true,
      },
    ];
  },
};
export default withNextIntl(nextConfig);
