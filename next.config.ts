import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.huntlogic.com",
      },
    ],
  },

  // PWA support — enable when @ducanh2912/next-pwa is installed
  // const withPWA = require("@ducanh2912/next-pwa")({
  //   dest: "public",
  //   disable: process.env.NODE_ENV === "development",
  //   register: true,
  //   skipWaiting: true,
  // });
  // module.exports = withPWA(nextConfig);

  // Redirect API v1 health to top-level health
  async redirects() {
    return [];
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
};

export default nextConfig;
