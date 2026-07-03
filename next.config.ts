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
      {
        source: "/pull-calculator",
        destination: "/drop-calculator",
        permanent: true,
      },
      {
        source: "/profile/account",
        destination: "/settings",
        permanent: true,
      },
      {
        source: "/profile/marketplace",
        destination: "/settings",
        permanent: true,
      },
      {
        source: "/profile/subscription",
        destination: "/settings",
        permanent: true,
      },
      {
        source: "/profile/overview",
        destination: "/settings",
        permanent: true,
      },
      {
        source: "/profile/export",
        destination: "/settings",
        permanent: true,
      },
      {
        source: "/profile/notifications",
        destination: "/settings",
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
        hostname: "*.r2.dev",
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
      {
        // Pokémon TCG card art — used by the /proto/ios multi-game mock data
        // today; will be needed again once real Pokémon data lands (PLAN.md).
        protocol: "https",
        hostname: "images.pokemontcg.io",
      },
    ],
  },
};

export default nextConfig;
