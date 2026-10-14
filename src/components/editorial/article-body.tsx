import type { ArticleHeading } from "@/lib/content/sanitize";
import Link from "next/link";
import { ArticleGallery } from "./article-gallery";

export function ArticleBody({ html }: { html: string }) {
  return <ArticleGallery html={html} />;
}

export function ArticleToc({ headings, href }: { headings: ArticleHeading[]; href: string }) {
  if (headings.length < 2) return null;

  return (
    <nav aria-label="Nesta matéria" className="border-t border-line pt-5">
      <p className="text-[0.66rem] font-black uppercase tracking-[0.1em] text-brand">Nesta matéria</p>
      <ol className="mt-3 space-y-2 text-sm leading-5">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? "pl-3" : ""}>
            <Link href={`${href}#${heading.id}`} prefetch={false} className="font-bold text-muted transition hover:text-brand">
              {heading.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
