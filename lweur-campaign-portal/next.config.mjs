/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Moved out of experimental per Next.js 15 deprecation warning
  outputFileTracingIncludes: {
    '/': ['./prisma/**/*']
  },
  eslint: {
    // Allow production builds to succeed even if there are ESLint errors.
    // (Consider fixing the reported errors and removing this override.)
    ignoreDuringBuilds: true
  },
  typescript: {
    // Temporary: allow production builds despite type errors (e.g., prisma client generation issues)
    ignoreBuildErrors: true
  }
};

export default nextConfig;
