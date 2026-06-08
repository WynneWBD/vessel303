import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 4,
  },
  images: {
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/global',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://www.303vessel.cn',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://www.303vessel.cn https://303vessel.cn",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/products/e6',
        destination: '/products/e6-gen6-standard',
        statusCode: 301,
      },
      {
        source: '/products/e3',
        destination: '/products/e3-gen6-standard',
        statusCode: 301,
      },
      {
        source: '/:locale(en|zh|cn)/global',
        destination: '/global',
        permanent: true,
      },
      {
        source: '/innovation',
        destination: '/about#technologies',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
