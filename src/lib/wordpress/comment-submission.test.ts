import { describe, expect, it } from "vitest";
import {
  COMMENT_LIMITS,
  createSlidingWindowRateLimiter,
  getUtf8ByteLength,
  isSameOriginRequest,
  validateCommentSubmission,
} from "./comment-submission";

const validPayload = {
  postId: 42,
  authorName: "  Maria   Silva  ",
  authorEmail: " MARIA@EXAMPLE.COM ",
  content: "  Gostei muito da matéria!  ",
  company: "",
};

describe("validateCommentSubmission", () => {
  it("normaliza somente os campos necessários", () => {
    expect(validateCommentSubmission(validPayload)).toEqual({
      status: "valid",
      value: {
        postId: 42,
        authorName: "Maria Silva",
        authorEmail: "maria@example.com",
        content: "Gostei muito da matéria!",
      },
    });
  });

  it("intercepta honeypot sem revelar a detecção", () => {
    expect(validateCommentSubmission({ ...validPayload, company: "Empresa Robô" })).toEqual({ status: "honeypot" });
  });

  it("recusa identificador, e-mail, controles e tamanhos inválidos", () => {
    expect(validateCommentSubmission({ ...validPayload, postId: 0 }).status).toBe("invalid");
    expect(validateCommentSubmission({ ...validPayload, authorEmail: "invalido" }).status).toBe("invalid");
    expect(validateCommentSubmission({ ...validPayload, content: "ok\u0000" }).status).toBe("invalid");
    expect(validateCommentSubmission({ ...validPayload, content: "x".repeat(COMMENT_LIMITS.contentMax + 1) }).status).toBe("invalid");
  });
});

describe("proteções de transporte", () => {
  it("aceita apenas a mesma origem", () => {
    const sameOrigin = { url: "https://site.test/api/comments/", headers: new Headers({ origin: "https://site.test", "sec-fetch-site": "same-origin" }) };
    const crossOrigin = { url: "https://site.test/api/comments/", headers: new Headers({ origin: "https://evil.test", "sec-fetch-site": "cross-site" }) };
    expect(isSameOriginRequest(sameOrigin)).toBe(true);
    expect(isSameOriginRequest(crossOrigin)).toBe(false);
    expect(isSameOriginRequest({ url: sameOrigin.url, headers: new Headers() })).toBe(false);
  });

  it("mede o limite pelo corpo UTF-8 real", () => {
    expect(getUtf8ByteLength("ação")).toBeGreaterThan("ação".length);
  });

  it("limita tentativas por janela e libera depois do prazo", () => {
    const limiter = createSlidingWindowRateLimiter(2, 1_000);
    expect(limiter.allow("cliente", 1_000)).toBe(true);
    expect(limiter.allow("cliente", 1_500)).toBe(true);
    expect(limiter.allow("cliente", 1_600)).toBe(false);
    expect(limiter.allow("cliente", 2_501)).toBe(true);
  });
});
