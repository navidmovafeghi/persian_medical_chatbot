/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure bcryptjs and other native modules work in serverless functions
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', '@prisma/client', 'pg'],
  },
  // Support Netlify deployments
  assetPrefix: process.env.NETLIFY ? '/' : undefined,
}

export default nextConfig 