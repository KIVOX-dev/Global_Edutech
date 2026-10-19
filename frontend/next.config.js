/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,  // Keep this enabled for better code quality
  swcMinify: true,        // Keep this enabled for faster builds
  images: {
    unoptimized: false,   // Set to false to enable image optimization
    domains: [],          // Add domains here if loading images from external sources
    formats: ['image/avif', 'image/webp'], // Modern image formats for better compression
  },
  // Proxy API calls to the Express backend so the browser stays same-origin (cookies keep working)
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://localhost:4000'
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }]
  },
}

// module.exports = nextConfig
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer( nextConfig )