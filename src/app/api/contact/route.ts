import { createHash } from "node:crypto";
import { createSlidingWindowRateLimiter, isSameOriginRequest } from "@/lib/wordpress/comment-submission";
import { validateContactSubmission } from "@/lib/wordpress/contact-submission";
import { getWordPressRestUrl } from "@/lib/wordpress/client";
import { getSiteUrl } from "@/lib/site-config";

export const runtime = "nodejs";
const limiter = createSlidingWindowRateLimiter(3, 600_000);
const json = (body: object, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!isSameOriginRequest(request, getSiteUrl())) return json({ error: "Origem não autorizada." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "Formato inválido." }, 415);
  const secret = process.env.WORDPRESS_COMMENTS_SECRET;
  if (!secret) return json({ error: "Formulário temporariamente indisponível." }, 503);
  const address = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
  const fingerprint = createHash("sha256").update(address).digest("hex");
  if (!limiter.allow(fingerprint)) return json({ error: "Aguarde alguns minutos antes de enviar outra mensagem." }, 429);
  const reader = request.body?.getReader();
  if (!reader) return json({ error: "Mensagem vazia." }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16_384) { await reader.cancel(); return json({ error: "Mensagem muito grande." }, 413); }
    chunks.push(value);
  }
  let payload: unknown;
  try { payload = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { return json({ error: "Dados inválidos." }, 400); }
  const result = validateContactSubmission(payload);
  if (result.status === "honeypot") return json({ status: "received" }, 201);
  if (result.status === "invalid") return json({ error: result.error }, 400);
  try {
    const response = await fetch(getWordPressRestUrl("promogames/v1/contact"), {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(15_000),
      headers: { "Content-Type": "application/json", "X-PromoGames-Comments-Secret": secret },
      body: JSON.stringify({ ...result.value, fingerprint }),
    });
    if (!response.ok) return json({ error: response.status === 429 ? "Aguarde alguns minutos antes de tentar novamente." : "Não foi possível registrar sua mensagem agora." }, response.status === 429 ? 429 : 502);
    return json({ status: "received" }, 201);
  } catch { return json({ error: "Falha de conexão. Tente novamente em instantes." }, 502); }
}
