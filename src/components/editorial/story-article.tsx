import Image from "next/image";
import Link from "next/link";
import { CommentsSection } from "@/components/editorial/comments-section";
import { AdSlot } from "@/components/platform/ad-slot";
import { StructuredData } from "@/components/structured-data";
import { prepareArticleContent } from "@/lib/content/sanitize";
import { formatDate } from "@/lib/format";
import { getSiteUrl, siteConfig } from "@/lib/site-config";
import { getCommentsByPostId, getStories } from "@/lib/wordpress/queries";
import type { Story } from "@/lib/wordpress/types";
import { ArticleBody, ArticleToc } from "./article-body";
import { StoryCard } from "./story-card";

export async function StoryArticle({ story, preview = false }: { story: Story; preview?: boolean }) {
  const article = prepareArticleContent(story.content);
  const [related, comments] = await Promise.all([
    getStories({ categoryId: story.primaryCategory?.id, exclude: [story.id], perPage: 3 }),
    preview ? Promise.resolve([]) : getCommentsByPostId(story.id),
  ]);
  const siteUrl = getSiteUrl();
  const storyUrl = `${siteUrl}${story.href}`;
  const shareUrl = encodeURIComponent(storyUrl);
  const shareTitle = encodeURIComponent(story.title);
  const wasUpdated = new Date(story.modifiedAt).getTime() - new Date(story.publishedAt).getTime() > 86_400_000;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        "@id": `${storyUrl}#article`,
        headline: story.title,
        description: story.deck ?? story.excerpt,
        image: story.image ? [story.image.url] : undefined,
        datePublished: story.publishedAt,
        dateModified: story.modifiedAt,
        mainEntityOfPage: storyUrl,
        author: { "@type": "Person", name: story.author.name, url: `${siteUrl}${story.author.href}` },
        publisher: { "@type": "Organization", name: siteConfig.name, url: siteUrl },
        articleSection: story.primaryCategory?.name,
        keywords: [...story.categories, ...story.tags].map((term) => term.name).join(", "),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
          story.primaryCategory ? { "@type": "ListItem", position: 2, name: story.primaryCategory.name, item: `${siteUrl}${story.primaryCategory.href}` } : null,
          { "@type": "ListItem", position: story.primaryCategory ? 3 : 2, name: story.title, item: storyUrl },
        ].filter(Boolean),
      },
    ],
  };

  return (
    <article className="pb-20">
      {!preview ? <StructuredData data={jsonLd} /> : null}
      <header className="border-b border-line bg-surface px-4 py-10 sm:px-6 sm:py-14 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1220px]">
          <div className="flex flex-wrap gap-2">
            {story.categories.map((category) => (
              <Link key={category.id} href={category.href} className="rounded-full bg-canvas px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-brand">{category.name}</Link>
            ))}
          </div>
          <h1 className="font-display mt-6 max-w-5xl text-balance text-[clamp(2.45rem,6.2vw,5.7rem)] font-extrabold leading-[0.96] tracking-[-0.065em]">{story.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted sm:text-xl">{story.deck ?? story.excerpt}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-6 text-sm">
            <Link href={story.author.href} className="font-extrabold transition hover:text-brand">Por {story.author.name}</Link>
            <span className="text-muted">{formatDate(story.publishedAt, true)}</span>
            {wasUpdated ? <span className="text-muted">Atualizado em {formatDate(story.modifiedAt, true)}</span> : null}
            <span className="text-muted">{story.readingMinutes} min de leitura</span>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1220px]">
          <div className="relative -mt-px aspect-video overflow-hidden rounded-b-card bg-[#151219]">
            {story.image ? <Image fill priority src={story.image.url} alt={story.image.alt || story.title} sizes="(max-width: 1024px) 100vw, 1220px" className="object-cover" /> : null}
          </div>

          <div className="grid gap-10 py-10 lg:grid-cols-[80px_minmax(0,760px)_minmax(180px,1fr)] lg:py-14">
            <aside className="flex gap-2 lg:sticky lg:top-6 lg:h-fit lg:flex-col" aria-label="Compartilhar matéria">
              <a href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`} target="_blank" rel="noreferrer" className="grid size-11 place-items-center rounded-full border border-line bg-surface text-xs font-black transition hover:border-brand hover:text-brand" aria-label="Compartilhar no X">X</a>
              <a href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`} target="_blank" rel="noreferrer" className="grid size-11 place-items-center rounded-full border border-line bg-surface text-xs font-black transition hover:border-brand hover:text-brand" aria-label="Compartilhar no WhatsApp">WA</a>
            </aside>

            <ArticleBody html={article.html} />

            <div className="h-fit space-y-5 lg:sticky lg:top-6">
              <aside className="rounded-card border border-line bg-surface p-5">
                <p className="text-[0.66rem] font-black uppercase tracking-[0.1em] text-brand">Sobre o autor</p>
                <div className="mt-4 flex items-center gap-3">
                  {story.author.avatarUrl ? <Image src={story.author.avatarUrl} width={48} height={48} alt="" className="rounded-full" /> : <span className="grid size-12 place-items-center rounded-full bg-brand font-display font-black text-white">{siteConfig.brandMark}</span>}
                  <div>
                    <Link href={story.author.href} className="font-display font-extrabold transition hover:text-brand">{story.author.name}</Link>
                    <p className="text-xs text-muted">{siteConfig.newsroomLabel}</p>
                  </div>
                </div>
                {story.author.description ? <p className="mt-4 text-sm leading-6 text-muted">{story.author.description}</p> : null}
              </aside>
              <ArticleToc headings={article.headings} />
            </div>
          </div>

          <AdSlot name="article-inline" format="billboard" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_INLINE} />

          {related.items.length ? (
            <section className="border-t border-line py-12 lg:py-16">
              <p className="eyebrow">Continue jogando</p>
              <h2 className="font-display text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Leia também</h2>
              <div className="mt-7 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">{related.items.map((item) => <StoryCard key={item.id} story={item} />)}</div>
            </section>
          ) : null}

          {!preview ? <CommentsSection comments={comments} postId={story.id} commentsOpen={story.commentStatus === "open"} submissionEnabled={Boolean(process.env.WORDPRESS_COMMENTS_SECRET)} /> : null}
        </div>
      </div>
    </article>
  );
}
