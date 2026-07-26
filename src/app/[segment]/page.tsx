import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArchiveHeader, StoryArchive } from "@/components/editorial/archive";
import { InstitutionalPage } from "@/components/editorial/institutional-page";
import { StoryArticle } from "@/components/editorial/story-article";
import { parsePage } from "@/lib/pagination";
import { siteConfig } from "@/lib/site-config";
import { getHrefSegments } from "@/lib/wordpress/mappers";
import { getCategoryMetadata, getPageMetadata, getStoryMetadata } from "@/lib/wordpress/metadata";
import { getCategories, getCategoryBySlug, getPageBySlug, getStories, getStoryBySlug } from "@/lib/wordpress/queries";
import type { Story, WordPressPage, WordPressTerm } from "@/lib/wordpress/types";

type RootContent =
  | { kind: "category"; category: WordPressTerm }
  | { kind: "story"; story: Story }
  | { kind: "page"; page: WordPressPage };

function matchesRootHref(href: string, slug: string) {
  const segments = getHrefSegments(href);
  return segments.length === 1 && segments[0] === slug;
}

async function resolveRootContent(slug: string): Promise<RootContent | null> {
  const category = await getCategoryBySlug(slug);
  if (category && (category.parent ?? 0) === 0) return { kind: "category", category };

  const story = await getStoryBySlug(slug);
  if (story) return { kind: "story", story };

  const page = await getPageBySlug(slug);
  return page ? { kind: "page", page } : null;
}

export async function generateStaticParams() {
  const [{ items }, categories] = await Promise.all([getStories({ perPage: 12 }), getCategories()]);
  const slugs = new Set([
    ...items.filter((story) => matchesRootHref(story.href, story.slug)).map((story) => story.slug),
    ...categories
      .filter((category) => (category.parent ?? 0) === 0 && matchesRootHref(category.href, category.slug))
      .map((category) => category.slug),
  ]);
  return [...slugs].map((segment) => ({ segment }));
}

export async function generateMetadata({ params, searchParams }: PageProps<"/[segment]">): Promise<Metadata> {
  const { segment: slug } = await params;
  const content = await resolveRootContent(slug);
  if (!content) return {};

  if (content.kind === "category") {
    const query = await searchParams;
    return getCategoryMetadata(content.category, parsePage(query.page));
  }
  if (content.kind === "story") return getStoryMetadata(content.story);
  return getPageMetadata(content.page);
}

export default async function SlugPage({ params, searchParams }: PageProps<"/[segment]">) {
  const { segment: slug } = await params;
  const content = await resolveRootContent(slug);
  if (!content) notFound();

  if (content.kind === "category") {
    if (!matchesRootHref(content.category.href, slug)) permanentRedirect(content.category.href);

    const query = await searchParams;
    const page = parsePage(query.page);
    const result = await getStories({ categoryId: content.category.id, page, perPage: 12 });
    if (page > 1 && result.totalPages > 0 && page > result.totalPages) notFound();

    return (
      <>
        <ArchiveHeader eyebrow="Universo" title={content.category.name} description={content.category.description || `Notícias, análises e novidades de ${content.category.name} selecionadas pela redação ${siteConfig.name}.`} count={result.total} />
        <StoryArchive result={result} emptyMessage={`Ainda não há matérias em ${content.category.name}.`} />
      </>
    );
  }

  if (content.kind === "story") {
    if (!matchesRootHref(content.story.href, slug)) permanentRedirect(content.story.href);
    return <StoryArticle story={content.story} />;
  }

  return <InstitutionalPage page={content.page} />;
}
