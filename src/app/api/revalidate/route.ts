import { revalidatePath, revalidateTag } from "next/cache";
import { safeSecretEqual } from "@/lib/security";
import { siteConfig } from "@/lib/site-config";

type RevalidationPayload = {
  slug?: string;
  tags?: string[];
  paths?: string[];
};

const bodyLimit = 16 * 1024;
const allowedTagPattern = /^(wordpress|stories|pages|categories|authors|comments|home|(?:story|page):[a-z0-9-]+|comments:\d+)$/;

async function readLimitedBody(request: Request) {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let body = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > bodyLimit) {
      await reader.cancel();
      return null;
    }
    body += decoder.decode(value, { stream: true });
  }

  return body + decoder.decode();
}

export async function POST(request: Request) {
  const suppliedSecret = request.headers.get("x-promogames-secret");
  if (!safeSecretEqual(suppliedSecret, process.env.REVALIDATE_SECRET)) {
    return Response.json({ error: "Webhook não autorizado." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return Response.json({ error: "Formato de solicitação inválido." }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > bodyLimit) {
    return Response.json({ error: "Solicitação muito grande." }, { status: 413 });
  }

  const body = await readLimitedBody(request);
  if (body === null) return Response.json({ error: "Solicitação muito grande." }, { status: 413 });

  let payload: RevalidationPayload;
  try {
    payload = JSON.parse(body) as RevalidationPayload;
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const allowedTags = new Set<string>();
  if (payload.slug && /^[a-z0-9-]+$/.test(payload.slug)) allowedTags.add(`story:${payload.slug}`);
  const requestedTags = Array.isArray(payload.tags) ? payload.tags : [];
  for (const tag of requestedTags.slice(0, 32)) {
    if (allowedTagPattern.test(tag)) allowedTags.add(tag);
  }
  for (const tag of allowedTags) revalidateTag(tag, { expire: 0 });

  const paths = new Set<string>();
  if (["stories", "pages", "home"].some((tag) => allowedTags.has(tag))) paths.add("/");
  if (siteConfig.profile === "promogames" && payload.slug && /^[a-z0-9-]+$/.test(payload.slug)) {
    paths.add(`/${payload.slug}/`);
  }
  const requestedPaths = Array.isArray(payload.paths) ? payload.paths : [];
  for (const path of requestedPaths.slice(0, 32)) {
    if (/^\/(?:[a-z0-9-]+\/){1,3}$/.test(path)) paths.add(path);
  }
  for (const path of paths) revalidatePath(path, "page");

  console.info(`[${siteConfig.profile}] Conteúdo revalidado`, { tags: [...allowedTags], paths: [...paths] });

  return Response.json({ revalidated: true, tags: [...allowedTags], paths: [...paths], at: new Date().toISOString() });
}
