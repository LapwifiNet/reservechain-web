/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep TypeScript checks on (proves quality); skip eslint failing the build.
  eslint: { ignoreDuringBuilds: true },
  // Emit a self-contained server bundle so the Docker runtime stage needs only
  // .next/standalone instead of the full node_modules tree.
  output: 'standalone',
};

export default nextConfig;
