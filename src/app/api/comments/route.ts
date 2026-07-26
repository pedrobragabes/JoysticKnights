import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import {
  COMMENT_LIMITS,
  createSlidingWindowRateLimiter,
  isSameOriginRequest,
  validateCommentSubmission,
} from "@/lib/wordpress/comment-submission";
import { getWordPressRestUrl, WordPressApiError } from "@/lib/wordpress/client";

export const runtime = "nodejs";

const rateLimiter = createSlidingWindowRateLimiter(COMMENT_LIMITS.attempts, COMMENT_LIMITS.windowMs);

function json(payload: object, status: number, headers: HeadersInit = {}) {
  return Response.json(payload, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function getRateLimitKey(request: Request) {
  const forwardedAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwardedAddress || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return createHash("sha256").update(`${address}\u0000${userAgent}`).digest("hex");
}

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
    if (totalBytes > COMMENT_LIMITS.bodyBytes) {
      await reader.cancel();
      return null;
    }
    body += decoder.decode(value, { stream: true });
  }

  return body + decoder.decode();
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return json({ error: "Origem da solicitação não autorizada." }, 403);
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return json({ error: "Formato de solicitação inválido." }, 415);
  }

  const commentsSecret = process.env.WORDPRESS_COMMENTS_SECRET;
  if (!commentsSecret) {
    return json({ error: "O envio de comentários ainda não foi configurado." }, 503);
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > COMMENT_LIMITS.bodyBytes) {
    return json({ error: "Solicitação muito grande." }, 413);
  }

  if (!rateLimiter.allow(getRateLimitKey(request))) {
    return json(
      { error: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente." },
      429,
      { "Retry-After": String(Math.ceil(COMMENT_LIMITS.windowMs / 1_000)) },
    );
  }

  const body = await readLimitedBody(request);
  if (body === null) return json({ error: "Solicitação muito grande." }, 413);

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }

  const validation = validateCommentSubmission(payload);
  if (validation.status === "honeypot") return json({ status: "pending" }, 202);
  if (validation.status === "invalid") return json({ error: validation.error }, 400);

  try {
    const wordpressResponse = await fetch(getWordPressRestUrl("promogames/v1/comments"), {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-PromoGames-Comments-Secret": commentsSecret,
      },
      body: JSON.stringify({
        post: validation.value.postId,
        author_name: validation.value.authorName,
        author_email: validation.value.authorEmail,
        content: validation.value.content,
      }),
    });
    if (!wordpressResponse.ok) {
      throw new WordPressApiError("O WordPress recusou o comentário.", wordpressResponse.status, wordpressResponse.url);
    }
    const response = await wordpressResponse.json() as { id: number; status: string };

    if (response.status === "approved") {
      revalidateTag("comments", { expire: 0 });
      revalidateTag(`comments:${validation.value.postId}`, { expire: 0 });
      return json({ status: "approved" }, 201);
    }
    return json({ status: "pending" }, 202);
  } catch (error) {
    const status = error instanceof WordPressApiError ? error.status : undefined;
    if (status === 409) return json({ error: "Este comentário já foi enviado." }, 409);
    if (status === 400) return json({ error: "O WordPress recusou os dados do comentário." }, 400);
    if (status === 401) return json({ error: "A integração de comentários está temporariamente indisponível." }, 502);
    if (status === 403) return json({ error: "Os comentários desta matéria estão fechados." }, 403);
    return json({ error: "Não foi possível enviar o comentário agora." }, 502);
  }
}
