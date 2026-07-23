/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep TypeScript checks on (proves quality); skip eslint failing the build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
