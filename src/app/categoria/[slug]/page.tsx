import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArchiveHeader, StoryArchive } from "@/components/editorial/archive";
import { parsePage } from "@/lib/pagination";
import { siteConfig } from "@/lib/site-config";
import { getCategoryMetadata } from "@/lib/wordpress/metadata";
import { getCategories, getCategoryBySlug, getStories } from "@/lib/wordpress/queries";

export async function generateStaticParams() {
  return (await getCategories()).map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps<"/categoria/[slug]">): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return getCategoryMetadata(category, parsePage(query.page));
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/categoria/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  if (category.href !== `/categoria/${slug}/`) permanentRedirect(category.href);

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
