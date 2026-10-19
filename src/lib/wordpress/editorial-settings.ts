import "server-only";
import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { getWordPressRestUrl } from "./client";
import { resolveEditorialSettings } from "../editorial-settings";
export const getEditorialSettings = cache(async () => {
  if (process.env.WORDPRESS_EDITORIAL_SETTINGS_ENABLED !== "true") return resolveEditorialSettings(null);
  try {
    const response = await fetch(getWordPressRestUrl("promogames/v1/editorial-settings"), { cache: "no-store", signal: AbortSignal.timeout(3000), redirect: "error" });
    return resolveEditorialSettings(response.ok ? await response.json() : null);
  } catch (error) { unstable_rethrow(error); return resolveEditorialSettings(null); }
});
