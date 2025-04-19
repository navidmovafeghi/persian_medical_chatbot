/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // If your application needs different configuration for production vs development,
  // you can use the following structure
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000"
  }
};

module.exports = nextConfig; 