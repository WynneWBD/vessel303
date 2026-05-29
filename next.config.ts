import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
        source: '/innovation',
        destination: '/about#technologies',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
