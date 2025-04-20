/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Ensure bcryptjs and other native modules work in serverless functions
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', '@prisma/client', 'pg'],
  },
  // Add source maps for proper error reporting
  productionBrowserSourceMaps: true
}

export default nextConfig 