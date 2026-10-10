import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['tesseract.js', 'tesseract.js-core', 'sharp'],
  outputFileTracingIncludes: {
    '/api/pokemon-card/scan': ['./data/tessdata/**/*'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io',
      },
    ],
  },
}

export default nextConfig
