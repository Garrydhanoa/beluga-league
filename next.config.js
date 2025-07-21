/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cdn.wallpapersafari.com',
      'www.rocketleague.com',
      'cdn2.unrealengine.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
}

module.exports = nextConfig