"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { COMMENT_LIMITS } from "@/lib/wordpress/comment-submission";

type Feedback = {
  kind: "idle" | "submitting" | "approved" | "pending" | "error";
  message?: string;
};

export function CommentForm({ postId }: { postId: number }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
  const isSubmitting = feedback.kind === "submitting";

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    setFeedback({ kind: "submitting" });

    try {
      const response = await fetch("/api/comments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          authorName: formData.get("authorName"),
          authorEmail: formData.get("authorEmail"),
          content: formData.get("content"),
          company: formData.get("company"),
        }),
      });
      const result = await response.json().catch(() => null) as { status?: string; error?: string } | null;

      if (!response.ok) {
        setFeedback({ kind: "error", message: result?.error || "Não foi possível enviar o comentário." });
        return;
      }

      form.reset();
      if (result?.status === "approved") {
        setFeedback({ kind: "approved", message: "Comentário publicado com sucesso." });
        router.refresh();
      } else {
        setFeedback({ kind: "pending", message: "Comentário enviado e aguardando moderação." });
      }
    } catch {
      setFeedback({ kind: "error", message: "Falha de conexão. Tente novamente em instantes." });
    }
  }

  return (
    <form onSubmit={submitComment} className="mt-8 rounded-card border border-line bg-surface p-5 sm:p-7" aria-busy={isSubmitting}>
      <h3 className="font-display text-2xl font-extrabold tracking-[-0.035em]">Participe da conversa</h3>
      <p id="comment-form-help" className="mt-2 text-sm leading-6 text-muted">
        Seu e-mail é usado apenas para moderação e não será publicado. Campos marcados são obrigatórios.
      </p>

      <fieldset disabled={isSubmitting} className="mt-6 grid gap-5 sm:grid-cols-2" aria-describedby="comment-form-help">
        <label className="grid gap-2 text-sm font-bold">
          Nome <span aria-hidden="true">*</span>
          <input
            required
            name="authorName"
            type="text"
            autoComplete="name"
            minLength={COMMENT_LIMITS.authorNameMin}
            maxLength={COMMENT_LIMITS.authorNameMax}
            className="min-h-11 rounded-xl border border-line bg-canvas px-4 font-normal outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          E-mail <span aria-hidden="true">*</span>
          <input
            required
            name="authorEmail"
            type="email"
            autoComplete="email"
            maxLength={COMMENT_LIMITS.authorEmailMax}
            className="min-h-11 rounded-xl border border-line bg-canvas px-4 font-normal outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>

        <div className="sr-only" aria-hidden="true">
          <label>
            Empresa
            <input name="company" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-bold sm:col-span-2">
          Comentário <span aria-hidden="true">*</span>
          <textarea
            required
            name="content"
            rows={6}
            minLength={COMMENT_LIMITS.contentMin}
            maxLength={COMMENT_LIMITS.contentMax}
            className="rounded-xl border border-line bg-canvas px-4 py-3 font-normal leading-6 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-black text-white transition hover:bg-brand-strong disabled:cursor-wait disabled:opacity-60">
            {isSubmitting ? "Enviando…" : "Enviar comentário"}
          </button>
          {feedback.kind !== "idle" && feedback.kind !== "submitting" ? (
            <p
              role={feedback.kind === "error" ? "alert" : "status"}
              aria-live={feedback.kind === "error" ? "assertive" : "polite"}
              className={feedback.kind === "error" ? "text-sm font-bold text-red-700" : "text-sm font-bold text-brand"}
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      </fieldset>
    </form>
  );
}
