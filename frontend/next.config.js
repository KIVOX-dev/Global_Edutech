/** @type {import('next').NextConfig} */
// NEXT_OUTPUT=export builds a static site (served by the Express/AppSail service from backend/public).
// The default build is unchanged, so the Vercel deployment of the landing page keeps working.
const isStaticExport = process.env.NEXT_OUTPUT === 'export'

const nextConfig = {
  ...(isStaticExport ? { output: 'export', trailingSlash: false } : {}),
  reactStrictMode: true,  // Keep this enabled for better code quality
  swcMinify: true,        // Keep this enabled for faster builds
  images: {
    unoptimized: isStaticExport,   // static export cannot use the image optimizer; the Vercel build still does
    domains: [],          // Add domains here if loading images from external sources
    formats: ['image/avif', 'image/webp'], // Modern image formats for better compression
  },
  // Proxy API calls to the Express backend so the browser stays same-origin (cookies keep working)
  async rewrites() {
    if (isStaticExport) return [] // same origin in production: Express serves /api itself
    const backend = process.env.BACKEND_URL || 'http://localhost:4000'
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }]
  },
}

// module.exports = nextConfig
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer( nextConfig )