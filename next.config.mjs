/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Ensure bcryptjs and other native modules work in serverless functions
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', '@prisma/client', 'pg'],
  },
  // Add source maps for proper error reporting
  productionBrowserSourceMaps: true,
  // Ensure entire app is included in serverless functions
  transpilePackages: ['next-auth', 'jose'],
  // Support root paths
  basePath: '',
  // More detailed error reporting
  reactStrictMode: true
}

export default nextConfig 