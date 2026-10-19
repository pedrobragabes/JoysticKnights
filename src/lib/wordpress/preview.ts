import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getWordPressRestUrl } from "./client";
import { mapPost } from "./mappers";
import type { RawPost } from "./raw-types";

export const previewCookie = "promogames-preview-scope";
export type PreviewScope = { postId: number; ticket: string; expiresAt: number };
function secret() { return process.env.DRAFT_MODE_SECRET && process.env.DRAFT_MODE_SECRET.length >= 32 ? process.env.DRAFT_MODE_SECRET : null; }
export function validPreviewScope(value: unknown): value is PreviewScope {
  if (!value || typeof value !== "object") return false;
  const data = value as PreviewScope;
  const now = Math.floor(Date.now() / 1000);
  return Number.isInteger(data.postId) && data.postId > 0 && typeof data.ticket === "string" && /^[a-f0-9]{64}$/.test(data.ticket) && Number.isInteger(data.expiresAt) && data.expiresAt > now && data.expiresAt <= now + 900;
}
export function signPreviewScope(scope: PreviewScope): string | null {
  const key = secret();
  if (!key || !validPreviewScope(scope)) return null;
  const payload = Buffer.from(JSON.stringify(scope)).toString("base64url");
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}
export function parsePreviewScope(value: string | undefined): PreviewScope | null {
  const key = secret();
  if (!key || !value || value.length > 600) return null;
  const parts = value.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return null;
  const expected = createHmac("sha256", key).update(parts[0]).digest();
  const supplied = Buffer.from(parts[1], "base64url");
  if (supplied.toString("base64url") !== parts[1] || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try { const scope: unknown = JSON.parse(Buffer.from(parts[0], "base64url").toString()); return validPreviewScope(scope) ? scope : null; } catch { return null; }
}
async function previewRequest(path: string, body: unknown) {
  const key = secret();
  if (!key) return null;
  try {
    const response = await fetch(getWordPressRestUrl(`promogames/v1/preview/${path}`), {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(10000), redirect: "error",
      headers: { "Content-Type": "application/json", "X-PromoGames-Preview": key }, body: JSON.stringify(body),
    });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}
export async function exchangePreviewCode(code: string): Promise<PreviewScope | null> {
  if (!/^[a-f0-9]{64}$/.test(code)) return null;
  const result: unknown = await previewRequest("exchange", { code });
  return validPreviewScope(result) ? result : null;
}
export async function getScopedPreviewStory(id: number) {
  if (!Number.isInteger(id) || id < 1) return null;
  const scope = parsePreviewScope((await cookies()).get(previewCookie)?.value);
  if (!scope || scope.postId !== id) return null;
  const result = await previewRequest("snapshot", { id, ticket: scope.ticket });
  if (!result?.post || result.post.id !== id || typeof result.post.title?.rendered !== "string" || typeof result.post.content?.rendered !== "string") return null;
  return mapPost(result.post as RawPost);
}
