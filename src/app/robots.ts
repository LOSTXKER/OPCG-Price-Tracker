import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kumatracker.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/portfolio", "/watchlist", "/profile", "/marketplace/create", "/messages"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
