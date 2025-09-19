import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // basePath configuration for production deployment
  basePath: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/milestone-app' : '',

  // Treat pdfkit as external to avoid bundling issues with font files
  serverExternalPackages: ['pdfkit'],

  // Configure server actions to handle port forwarding properly
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase limit for large PDFs
    },
  },

  // Allow any types in interfaces for database compatibility
  eslint: {
    ignoreDuringBuilds: true,
  },

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
