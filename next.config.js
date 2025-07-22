/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: [],
  },
  ...(process.env.CLOUDFLARE_DEPLOY === 'true' ? { output: 'export' } : {}),
}

module.exports = nextConfig