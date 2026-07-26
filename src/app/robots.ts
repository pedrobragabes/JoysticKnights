import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const indexingEnabled = process.env.NEXT_PUBLIC_INDEXING_ENABLED !== "false";
  return {
    rules: indexingEnabled
      ? { userAgent: "*", allow: "/", disallow: ["/api/", "/preview/", "/buscar/"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
