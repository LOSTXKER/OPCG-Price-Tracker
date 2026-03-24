import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
