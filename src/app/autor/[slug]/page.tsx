import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ArchiveHeader, StoryArchive } from "@/components/editorial/archive";
import { parsePage } from "@/lib/pagination";
import { siteConfig } from "@/lib/site-config";
import { getHrefSegments } from "@/lib/wordpress/mappers";
import { getAuthorMetadata } from "@/lib/wordpress/metadata";
import { getAuthorBySlug, getAuthors, getStories } from "@/lib/wordpress/queries";

function isAuthorHref(href: string, prefix: string, slug: string) {
  const segments = getHrefSegments(href);
  return segments.length === 2 && segments[0] === prefix && segments[1] === slug;
}

function getPageHref(href: string, page: number) {
  return page > 1 ? `${href}?page=${page}` : href;
}

export async function generateStaticParams() {
  return (await getAuthors()).map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps<"/autor/[slug]">): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const author = await getAuthorBySlug(slug);
  if (!author) return {};
  return getAuthorMetadata(author, parsePage(query.page));
}

export default async function AuthorPage({ params, searchParams }: PageProps<"/autor/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const page = parsePage(query.page);
  if (!isAuthorHref(author.href, "autor", slug)) permanentRedirect(getPageHref(author.href, page));

  const result = await getStories({ authorId: author.id, page, perPage: 12 });
  if (page > 1 && result.totalPages > 0 && page > result.totalPages) notFound();

  return (
    <>
      <ArchiveHeader eyebrow="Autor" title={author.name} description={author.description || `Redação, apuração e opinião no ${siteConfig.name}.`} count={result.total} avatarUrl={author.avatarUrl} />
      <StoryArchive result={result} emptyMessage="Este autor ainda não publicou matérias." />
    </>
  );
}
