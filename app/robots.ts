import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/auth/confirm", "/auth/callback", "/auth/reset-password"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
