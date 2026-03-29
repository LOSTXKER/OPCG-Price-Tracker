import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/boxes",
        destination: "/sets",
        permanent: true,
      },
      {
        source: "/boxes/:path*",
        destination: "/sets/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.onepiece-cardgame.com",
      },
      {
        protocol: "https",
        hostname: "asia-en.onepiece-cardgame.com",
      },
      {
        protocol: "https",
        hostname: "yuyu-tei.jp",
      },
      {
        protocol: "https",
        hostname: "card.yuyu-tei.jp",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "optcgapi.com",
      },
      {
        protocol: "https",
        hostname: "cdn.snkrdunk.com",
      },
      {
        protocol: "https",
        hostname: "en-assets.snkrdunk.com",
      },
    ],
  },
};

export default nextConfig;
