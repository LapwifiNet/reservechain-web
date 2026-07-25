import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle so the Docker runtime stage needs only
  // .next/standalone instead of the full node_modules tree.
  output: 'standalone',
};
export default withNextIntl(nextConfig);
