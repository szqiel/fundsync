/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bypass ESLint errors pas lagi build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Bypass TypeScript errors pas lagi build
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;