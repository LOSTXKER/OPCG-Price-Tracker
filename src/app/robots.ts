import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env";

const BASE_URL = clientEnv().NEXT_PUBLIC_APP_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Disallow = crawl control (app surfaces nobody links, don't spend
        // crawl budget). Index control lives in each page's `robots: { index:
        // false }` metadata instead — blocking a page here would stop Google
        // from ever READING that noindex, which is why /portfolio, /watchlist,
        // /login and /register are deliberately crawlable. /profile stays
        // crawlable so its canonical → /@handle can consolidate.
        disallow: [
          "/api/",
          "/admin/",
          "/admin-login",
          "/settings",
          "/messages",
          "/orders",
          "/seller/",
          "/marketplace/create",
          "/ref/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
