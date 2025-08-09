/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: [],
  },
  // Reduce terminal spam
  onDemandEntries: {
    // Keep pages in memory longer to reduce rebuilds
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
  },
  // Only show high priority logs in terminal
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  ...(process.env.CLOUDFLARE_DEPLOY === 'true' ? { output: 'export' } : {}),
}

module.exports = nextConfig
