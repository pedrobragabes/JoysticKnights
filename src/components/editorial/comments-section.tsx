import { sanitizeCommentHtml } from "@/lib/content/sanitize";
import { formatDate } from "@/lib/format";
import type { WordPressComment } from "@/lib/wordpress/types";
import { CommentForm } from "./comment-form";

export function CommentsSection({
  comments,
  postId,
  commentsOpen,
  submissionEnabled,
}: {
  comments: WordPressComment[];
  postId: number;
  commentsOpen: boolean;
  submissionEnabled: boolean;
}) {
  return (
    <section id="comentarios" className="border-t border-line py-12 lg:py-16" aria-labelledby="comments-title">
      <p className="eyebrow">Comunidade</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="comments-title" className="font-display text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Comentários</h2>
        <p className="text-sm font-bold text-muted">
          {comments.length} comentário{comments.length === 1 ? "" : "s"}
        </p>
      </div>

      {comments.length ? (
        <ol className="mt-8 space-y-4" aria-label="Comentários publicados">
          {comments.map((comment) => (
            <li
              id={`comment-${comment.id}`}
              key={comment.id}
              className={`rounded-card border border-line bg-surface p-5 sm:p-6 ${comment.parentId ? "ml-5 border-l-4 sm:ml-10" : ""}`}
            >
              <article aria-labelledby={`comment-author-${comment.id}`}>
                <header className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-display text-sm font-black text-white" aria-hidden="true">
                    {Array.from(comment.authorName)[0]?.toUpperCase() ?? "?"}
                  </span>
                  <div>
                    <h3 id={`comment-author-${comment.id}`} className="font-display font-extrabold">{comment.authorName}</h3>
                    <time dateTime={comment.publishedAt} className="text-xs text-muted">{formatDate(comment.publishedAt, true)}</time>
                  </div>
                </header>
                <div
                  className="article-body mt-4 text-sm leading-7"
                  dangerouslySetInnerHTML={{ __html: sanitizeCommentHtml(comment.content) }}
                />
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-8 rounded-card border border-dashed border-line bg-surface px-5 py-8 text-sm leading-6 text-muted">
          {commentsOpen
            ? "Ainda não há comentários publicados. Seja a primeira pessoa a participar."
            : "Nenhum comentário foi publicado antes do encerramento desta conversa."}
        </p>
      )}

      {commentsOpen && submissionEnabled ? (
        <CommentForm postId={postId} />
      ) : commentsOpen ? (
        <p className="mt-8 rounded-card border border-line bg-surface px-5 py-4 text-sm font-bold text-muted">
          O envio de novos comentários será habilitado na implantação headless.
        </p>
      ) : (
        <p className="mt-8 rounded-card border border-line bg-surface px-5 py-4 text-sm font-bold text-muted">
          Os comentários desta matéria estão encerrados.
        </p>
      )}
    </section>
  );
}
