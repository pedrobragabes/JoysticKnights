import { plainText } from "./wordpress/text";
export const defaultEditorialSettings = { title: "Notícias", highlightsTitle: "Destaques", platformsTitle: "Plataformas", feedTitle: "Últimas publicações", showRadar: true, showHighlights: true, showPlatforms: true, sections: ["highlights", "platforms"] as string[] };
export type EditorialSettings = typeof defaultEditorialSettings;
export function resolveEditorialSettings(input: unknown): EditorialSettings {
  const result = { ...defaultEditorialSettings, sections: [...defaultEditorialSettings.sections] };
  if (!input || typeof input !== "object" || Array.isArray(input)) return result;
  const raw = input as Record<string, unknown>;
  for (const key of ["title", "highlightsTitle", "platformsTitle", "feedTitle"] as const) if (typeof raw[key] === "string") result[key] = plainText(raw[key]).slice(0, 100) || result[key];
  for (const key of ["showRadar", "showHighlights", "showPlatforms"] as const) if (typeof raw[key] === "boolean") result[key] = raw[key];
  if (Array.isArray(raw.sections) && raw.sections.length === 2 && new Set(raw.sections).size === 2 && raw.sections.every((key) => ["highlights", "platforms"].includes(key))) result.sections = [...raw.sections];
  return result;
}
