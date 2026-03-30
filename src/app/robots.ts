import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env";

const BASE_URL = clientEnv().NEXT_PUBLIC_APP_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/admin-login",
          "/portfolio",
          "/watchlist",
          "/profile",
          "/settings",
          "/marketplace/create",
          "/messages",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
