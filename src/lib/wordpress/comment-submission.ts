export const COMMENT_LIMITS = {
  bodyBytes: 16_384,
  authorNameMin: 2,
  authorNameMax: 80,
  authorEmailMax: 254,
  contentMin: 3,
  contentMax: 5_000,
  attempts: 3,
  windowMs: 10 * 60 * 1_000,
} as const;

export type ValidCommentSubmission = {
  postId: number;
  authorName: string;
  authorEmail: string;
  content: string;
};

export type CommentValidationResult =
  | { status: "valid"; value: ValidCommentSubmission }
  | { status: "honeypot" }
  | { status: "invalid"; error: string };

const forbiddenControlCharacters = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const emailPattern = /^[^\s@]{1,64}@[^\s@]{1,189}\.[^\s@]{2,}$/;

export function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export function isSameOriginRequest(request: Pick<Request, "headers" | "url">) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin || (fetchSite && fetchSite !== "same-origin")) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function validateCommentSubmission(payload: unknown): CommentValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { status: "invalid", error: "Dados do comentário inválidos." };
  }

  const input = payload as Record<string, unknown>;
  const honeypot = typeof input.company === "string" ? input.company.trim() : "";
  if (honeypot) return { status: "honeypot" };

  if (!Number.isInteger(input.postId) || (input.postId as number) < 1) {
    return { status: "invalid", error: "Matéria inválida." };
  }
  if (typeof input.authorName !== "string" || typeof input.authorEmail !== "string" || typeof input.content !== "string") {
    return { status: "invalid", error: "Preencha nome, e-mail e comentário." };
  }

  const authorName = input.authorName.trim().replace(/\s+/g, " ");
  const authorEmail = input.authorEmail.trim().toLowerCase();
  const content = input.content.trim();

  if (
    authorName.length < COMMENT_LIMITS.authorNameMin
    || authorName.length > COMMENT_LIMITS.authorNameMax
    || forbiddenControlCharacters.test(authorName)
  ) {
    return { status: "invalid", error: `O nome deve ter entre ${COMMENT_LIMITS.authorNameMin} e ${COMMENT_LIMITS.authorNameMax} caracteres.` };
  }
  if (
    authorEmail.length > COMMENT_LIMITS.authorEmailMax
    || !emailPattern.test(authorEmail)
    || forbiddenControlCharacters.test(authorEmail)
  ) {
    return { status: "invalid", error: "Informe um e-mail válido." };
  }
  if (
    content.length < COMMENT_LIMITS.contentMin
    || content.length > COMMENT_LIMITS.contentMax
    || forbiddenControlCharacters.test(content)
  ) {
    return { status: "invalid", error: `O comentário deve ter entre ${COMMENT_LIMITS.contentMin} e ${COMMENT_LIMITS.contentMax} caracteres.` };
  }

  return {
    status: "valid",
    value: { postId: input.postId as number, authorName, authorEmail, content },
  };
}

export function createSlidingWindowRateLimiter(maxAttempts: number, windowMs: number, maxKeys = 5_000) {
  const attemptsByKey = new Map<string, number[]>();

  function pruneExpired(cutoff: number) {
    for (const [key, attempts] of attemptsByKey) {
      const recent = attempts.filter((timestamp) => timestamp > cutoff);
      if (recent.length) attemptsByKey.set(key, recent);
      else attemptsByKey.delete(key);
    }
  }

  return {
    allow(key: string, now = Date.now()) {
      const cutoff = now - windowMs;
      const recent = (attemptsByKey.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
      if (recent.length >= maxAttempts) {
        attemptsByKey.set(key, recent);
        return false;
      }

      if (!attemptsByKey.has(key) && attemptsByKey.size >= maxKeys) {
        pruneExpired(cutoff);
        if (attemptsByKey.size >= maxKeys) return false;
      }

      attemptsByKey.set(key, [...recent, now]);
      return true;
    },
    clear() {
      attemptsByKey.clear();
    },
  };
}
