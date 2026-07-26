import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArchiveHeader, StoryArchive } from "@/components/editorial/archive";
import { parsePage } from "@/lib/pagination";
import { siteConfig } from "@/lib/site-config";
import { getHrefSegments } from "@/lib/wordpress/mappers";
import { getCategoryMetadata } from "@/lib/wordpress/metadata";
import { getCategories, getCategoryBySlug, getStories } from "@/lib/wordpress/queries";
import type { WordPressTerm } from "@/lib/wordpress/types";

function getLegacyCategorySegments(category: WordPressTerm) {
  const hrefSegments = getHrefSegments(category.href);
  const categoryIndex = hrefSegments.indexOf("category");
  return categoryIndex >= 0 ? hrefSegments.slice(categoryIndex + 1) : [category.slug];
}

export async function generateStaticParams() {
  return (await getCategories()).flatMap((category) => {
    const segments = getLegacyCategorySegments(category);
    return segments.length ? [{ segments }] : [];
  });
}

export async function generateMetadata({ params, searchParams }: PageProps<"/category/[...segments]">): Promise<Metadata> {
  const [{ segments }, query] = await Promise.all([params, searchParams]);
  const slug = segments[segments.length - 1];
  if (!slug) return {};

  const category = await getCategoryBySlug(slug);
  return category ? getCategoryMetadata(category, parsePage(query.page)) : {};
}

export default async function LegacyCategoryPage({ params, searchParams }: PageProps<"/category/[...segments]">) {
  const [{ segments }, query] = await Promise.all([params, searchParams]);
  const slug = segments[segments.length - 1];
  if (!slug) notFound();

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const canonicalSegments = getHrefSegments(category.href);
  const requestedSegments = ["category", ...segments];
  if (canonicalSegments.length !== requestedSegments.length || canonicalSegments.some((segment, index) => segment !== requestedSegments[index])) {
    permanentRedirect(category.href);
  }

  const page = parsePage(query.page);
  const result = await getStories({ categoryId: category.id, page, perPage: 12 });
  if (page > 1 && result.totalPages > 0 && page > result.totalPages) notFound();

  return (
    <>
      <ArchiveHeader eyebrow="Universo" title={category.name} description={category.description || `Notícias, análises e novidades de ${category.name} selecionadas pela redação ${siteConfig.name}.`} count={result.total} />
      <StoryArchive result={result} emptyMessage={`Ainda não há matérias em ${category.name}.`} />
    </>
  );
}
