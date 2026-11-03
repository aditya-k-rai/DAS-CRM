import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_INTERNAL_URL ||
      (process.env.NODE_ENV === 'production'
        ? (process.env.NEXT_PUBLIC_API_URL || 'https://dascrm-backend.onrender.com/api/v1').replace(/\/api\/v1\/?$/, '')
        : 'http://localhost:3001');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
