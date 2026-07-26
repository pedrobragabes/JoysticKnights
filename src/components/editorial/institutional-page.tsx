import { ArticleBody, ArticleToc } from "@/components/editorial/article-body";
import { prepareArticleContent } from "@/lib/content/sanitize";
import type { WordPressPage } from "@/lib/wordpress/types";

export function InstitutionalPage({ page }: { page: WordPressPage }) {
  const content = prepareArticleContent(page.content);

  return (
    <article className="pb-20">
      <header className="border-b border-line bg-surface px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1220px]">
          <p className="eyebrow">Institucional</p>
          <h1 className="font-display mt-4 max-w-5xl text-balance text-[clamp(2.6rem,7vw,6rem)] font-extrabold leading-[0.93] tracking-[-0.065em]">
            {page.title}
          </h1>
          {page.excerpt ? <p className="mt-6 max-w-3xl text-lg leading-8 text-muted sm:text-xl">{page.excerpt}</p> : null}
        </div>
      </header>

      <div className="px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="mx-auto grid max-w-[980px] gap-10 lg:grid-cols-[minmax(0,760px)_minmax(160px,1fr)]">
          <ArticleBody html={content.html} />
          <aside className="h-fit lg:sticky lg:top-6">
            <ArticleToc headings={content.headings} />
          </aside>
        </div>
      </div>
    </article>
  );
}
