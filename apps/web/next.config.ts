import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Type errors still fail the build. No ESLint config is set up yet.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
