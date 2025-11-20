/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "blob.v0.app",
      },
    ],
    unoptimized: true,
  },
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
  },
  async redirects() {
    return [
      {
        source: '/profile',
        destination: '/app/profile',
        permanent: true,
      },
      {
        source: '/council',
        destination: '/app/council',
        permanent: true,
      },
      {
        source: '/council/:path*',
        destination: '/app/council/:path*',
        permanent: true,
      },
      {
        source: '/subscription/:path*',
        destination: '/app/subscription/:path*',
        permanent: true,
      },
      {
        source: '/setup-image-generation',
        destination: '/app/setup-image-generation',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/miami-ai-logo.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate',
          },
        ],
      },
      {
        source: '/:path*.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig
