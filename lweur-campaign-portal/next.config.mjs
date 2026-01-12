/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/': ['./prisma/**/*']
  },
  typescript: {
    // Temporary: allow production builds despite type errors
    ignoreBuildErrors: true
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
