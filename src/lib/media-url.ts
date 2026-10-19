import { siteConfig } from "./site-config";

export function isConfiguredMediaUrl(url: URL): boolean {
  if (url.username || url.password || !url.pathname.startsWith("/wp-content/uploads/")) return false;
  const cms = new URL(process.env.WORDPRESS_MEDIA_ORIGIN || process.env.WORDPRESS_API_URL || siteConfig.defaultWordPressApiUrl);
  if (url.protocol === "https:") return url.hostname === cms.hostname && !url.port;
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || siteConfig.defaultSiteUrl);
  const loopback = (hostname: string) => ["127.0.0.1", "localhost", "[::1]"].includes(hostname);
  return process.env.NODE_ENV === "development" && site.protocol === "http:" && loopback(site.hostname)
    && cms.protocol === "http:" && loopback(cms.hostname) && url.origin === cms.origin && !url.search;
}
