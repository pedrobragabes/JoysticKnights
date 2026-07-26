import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArchiveHeader, StoryArchive } from "@/components/editorial/archive";
import { parsePage } from "@/lib/pagination";
import { siteConfig } from "@/lib/site-config";
import { getHrefSegments } from "@/lib/wordpress/mappers";
import { getTagMetadata } from "@/lib/wordpress/metadata";
import { getStories, getTagBySlug, getTags } from "@/lib/wordpress/queries";

function isTagHref(href: string, slug: string) {
  const segments = getHrefSegments(href);
  return segments.length === 2 && segments[0] === "tag" && segments[1] === slug;
}

function getPageHref(href: string, page: number) {
  return page > 1 ? `${href}?page=${page}` : href;
}

export async function generateStaticParams() {
  return (await getTags()).map((tag) => ({ slug: tag.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps<"/tag/[slug]">): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const tag = await getTagBySlug(slug);
  return tag ? getTagMetadata(tag, parsePage(query.page)) : {};
}

export default async function TagPage({ params, searchParams }: PageProps<"/tag/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const page = parsePage(query.page);
  if (!isTagHref(tag.href, slug)) permanentRedirect(getPageHref(tag.href, page));

  const result = await getStories({ tagId: tag.id, page, perPage: 12 });
  if (page > 1 && result.totalPages > 0 && page > result.totalPages) notFound();

  return (
    <>
      <ArchiveHeader eyebrow="Assunto" title={tag.name} description={tag.description || `Notícias, análises e matérias sobre ${tag.name} no ${siteConfig.name}.`} count={result.total} />
      <StoryArchive result={result} emptyMessage={`Ainda não há matérias sobre ${tag.name}.`} />
    </>
  );
}
