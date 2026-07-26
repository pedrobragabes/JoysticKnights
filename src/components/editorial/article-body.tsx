import type { ArticleHeading } from "@/lib/content/sanitize";

export function ArticleBody({ html }: { html: string }) {
  return <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ArticleToc({ headings }: { headings: ArticleHeading[] }) {
  if (headings.length < 2) return null;

  return (
    <nav aria-label="Nesta matéria" className="border-t border-line pt-5">
      <p className="text-[0.66rem] font-black uppercase tracking-[0.1em] text-brand">Nesta matéria</p>
      <ol className="mt-3 space-y-2 text-sm leading-5">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? "pl-3" : ""}>
            <a href={`#${heading.id}`} className="font-bold text-muted transition hover:text-brand">
              {heading.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
