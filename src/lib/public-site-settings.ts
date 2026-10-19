import { siteConfig } from "./site-config";
import { isConfiguredMediaUrl } from "./media-url";
type HomeImage = { src: string; alt: string; width: number; height: number };
import { plainText } from "./wordpress/text";
export type PublicSiteSettings = { homeTitle: string; description: string; footerDescription: string; contactEmail: string; x?: string; instagram?: string; logo?: HomeImage; socialImage?: HomeImage };
export const defaultPublicSiteSettings: PublicSiteSettings = { homeTitle: `${siteConfig.name} — notícias, análises e cultura gamer`, description: siteConfig.description, footerDescription: siteConfig.shortDescription, contactEmail: siteConfig.contactEmail, x: siteConfig.social.x, instagram: siteConfig.social.instagram };
export function resolvePublicSiteSettings(input: unknown): PublicSiteSettings {
  if (!input || typeof input !== "object") return defaultPublicSiteSettings;
  const raw = input as Record<string, unknown>;
  const result = { ...defaultPublicSiteSettings };
  for (const field of ["homeTitle", "description", "footerDescription"] as const) if (typeof raw[field] === "string") result[field] = plainText(raw[field] as string).slice(0, field === "homeTitle" ? 120 : 500) || result[field];
  if (typeof raw.contactEmail === "string" && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(raw.contactEmail) && raw.contactEmail.length <= 254) result.contactEmail = raw.contactEmail;
  for (const field of ["x", "instagram"] as const) {
    if (raw[field] === "") { result[field] = undefined; continue; }
    if (typeof raw[field] !== "string") continue;
    try { const url = new URL(raw[field] as string); const allowed = field === "x" ? ["x.com", "twitter.com", "www.x.com", "www.twitter.com"] : ["instagram.com", "www.instagram.com"]; if (url.protocol === "https:" && !url.username && !url.password && !url.port && allowed.includes(url.hostname)) result[field] = url.href; } catch { /* Keep checked-in destination on malformed input. */ }
  }
  for (const field of ["logo", "socialImage"] as const) {
    const candidate = raw[field] as HomeImage | undefined;
    if (!candidate || typeof candidate.src !== "string") continue;
    try { const url = new URL(candidate.src); if (isConfiguredMediaUrl(url)) result[field] = { src: url.href, alt: plainText(candidate.alt ?? ""), width: Math.max(1, Math.min(10000, Number(candidate.width) || 512)), height: Math.max(1, Math.min(10000, Number(candidate.height) || 512)) }; } catch { /* Only media from the configured CMS is accepted. */ }
  }
  return result;
}
