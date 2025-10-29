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
  // Enable compression
  compress: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Enable SWC minification
  swcMinify: true,
}

export default nextConfig
