/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure bcryptjs and other native modules work in serverless functions
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', '@prisma/client', 'pg'],
  },
  // Add source maps for proper error reporting
  productionBrowserSourceMaps: true,
  // Support root paths
  basePath: '',
  // More detailed error reporting
  reactStrictMode: true
}

export default nextConfig 