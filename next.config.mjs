/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  // Optimize for Vercel deployment
  output: 'standalone',
  // Handle large API responses (for blood test analysis)
  api: {
    responseLimit: '8mb',
  },
  // Optimize images
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
