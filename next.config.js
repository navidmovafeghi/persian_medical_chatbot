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
  // Ensure we can use our SQLite database for both development and production
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  // If your application needs different configuration for production vs development,
  // you can use the following structure
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  // Fix issue with missing Prisma binary for Netlify
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, 'bcrypt'];
    }
    return config;
  },
};

module.exports = nextConfig; 