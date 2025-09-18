import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // basePath configuration for production deployment
  basePath: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',

  // Security headers for small dashboard app
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
