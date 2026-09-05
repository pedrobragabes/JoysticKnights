import { validateCommentSubmission } from "./comment-submission";

export function validateContactSubmission(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { status: "invalid", error: "Dados inválidos." } as const;
  const input = payload as Record<string, unknown>;
  const result = validateCommentSubmission({ ...input, postId: 1 });
  if (result.status !== "valid") return result;
  if (input.privacy !== true) return { status: "invalid", error: "Confirme a leitura da política de privacidade." } as const;
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  if (subject.length < 3 || subject.length > 120 || /[\r\n\x00-\x1f]/.test(subject)) return { status: "invalid", error: "Informe um assunto entre 3 e 120 caracteres." } as const;
  return { status: "valid", value: { ...result.value, subject } } as const;
}
