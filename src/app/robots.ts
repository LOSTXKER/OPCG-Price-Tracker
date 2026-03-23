import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tcg-price-tracker.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/portfolio", "/watchlist", "/profile", "/marketplace/create"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
