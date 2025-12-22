/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for Vercel deployment
  output: 'standalone',
  // Handle large API responses and external packages
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
  // Optimize images
  images: {
    domains: ['ccbapdsiisngnpyqryqg.supabase.co', 'wgeohahwwszibtdtduul.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true, // Re-enabled with proper effect protection
  // Suppress Supabase realtime-js critical dependency warning
  webpack: (config) => {
    config.module.exprContextCritical = false;
    return config;
  },
};

export default nextConfig;
