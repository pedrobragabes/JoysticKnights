import "server-only";
import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { getWordPressRestUrl } from "./client";
import { resolvePublicSiteSettings } from "../public-site-settings";
export const getPublicSiteSettings = cache(async () => {
  if (process.env.WORDPRESS_SITE_SETTINGS_ENABLED !== "true") return resolvePublicSiteSettings(null);
  try { const response = await fetch(getWordPressRestUrl("promogames/v1/site-settings"), { cache: "no-store", signal: AbortSignal.timeout(3000) }); return response.ok ? resolvePublicSiteSettings(await response.json()) : resolvePublicSiteSettings(null); } catch (error) { unstable_rethrow(error); return resolvePublicSiteSettings(null); }
});
