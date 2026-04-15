import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
