import "server-only";
import { wordPressRequest, WordPressApiError } from "./client";
import { getLocalHref, mapAuthor, mapTerm } from "./mappers";
import type { RawAuthor, RawMedia, RawTerm } from "./raw-types";

type SitemapRecord = { id: number; slug: string; link: string; modified: string; modified_gmt?: string | null; featured_media?: number };
type SitemapMedia = RawMedia & { id: number };
const recordFields = "id,slug,link,modified,modified_gmt";

// A complete inventory without invoking excerpt/content/SEO render filters or
// one embedded REST request per thumbnail. No persistent editorial cache.
async function collection<T extends { id: number }>(path: string, query: Record<string, string | number | boolean>) {
  const items: T[] = [];
  let pages = 1;
  let total = 0;
  for (let page = 1; page <= pages; page++) {
    const response = await wordPressRequest<T[]>(path, { ...query, page, per_page: 100, orderby: "id", order: "asc" }, ["wordpress", "sitemap"], { cache: "no-store" });
    if (!Array.isArray(response.data) || !Number.isInteger(response.totalPages) || response.totalPages < 0 || response.totalPages > 500
      || !Number.isInteger(response.total) || response.total < 0 || response.total > 50000) {
      throw new WordPressApiError("Inventário do sitemap inválido ou exige divisão em arquivos.", 503, path);
    }
    pages = response.totalPages;
    total = response.total;
    items.push(...response.data);
  }
  if (items.length !== total || new Set(items.map((item) => item.id)).size !== total) {
    throw new WordPressApiError("Inventário do sitemap incompleto; tente novamente.", 503, path);
  }
  return items;
}

function record(post: SitemapRecord) {
  const modifiedAt = post.modified_gmt?.trim();
  return { id: post.id, slug: post.slug, href: getLocalHref(post.link, `/${post.slug}/`),
    modifiedAt: modifiedAt ? (modifiedAt.endsWith("Z") ? modifiedAt : `${modifiedAt}Z`) : post.modified };
}

export async function getCompleteSitemapStories() {
  const posts = await collection<SitemapRecord>("/posts", { status: "publish", _fields: `${recordFields},featured_media` });
  const ids = [...new Set(posts.map((post) => post.featured_media).filter((id): id is number => Number.isInteger(id) && id! > 0))];
  const images = new Map<number, string>();
  // Sequential batches avoid overwhelming the shared CMS. Missing/deleted
  // attachments omit only the image; the article URL remains in the sitemap.
  for (let start = 0; start < ids.length; start += 100) {
    const response = await wordPressRequest<SitemapMedia[]>("/media", { include: ids.slice(start, start + 100), per_page: 100,
      _fields: "id,source_url,media_details.sizes.large,media_details.sizes.full" }, ["wordpress", "sitemap"], { cache: "no-store" });
    if (!Array.isArray(response.data)) throw new WordPressApiError("Mídia do sitemap inválida.", 503, "/media");
    for (const media of response.data) {
      const url = media.media_details?.sizes?.large?.source_url ?? media.media_details?.sizes?.full?.source_url ?? media.source_url;
      if (typeof url === "string" && /^https?:\/\//i.test(url)) images.set(media.id, url);
    }
  }
  return posts.map((post) => ({ ...record(post), image: images.has(post.featured_media ?? 0) ? { url: images.get(post.featured_media!)! } : undefined }));
}

export async function getCompleteSitemapPages() {
  return (await collection<SitemapRecord>("/pages", { status: "publish", _fields: recordFields })).map(record);
}
export async function getCompleteSitemapTerms(taxonomy: "categories" | "tags") {
  return (await collection<RawTerm>(`/${taxonomy}`, { hide_empty: taxonomy === "tags", _fields: "id,name,slug,link,taxonomy,parent,count,description" })).map(mapTerm);
}
export async function getCompleteSitemapAuthors() {
  return (await collection<RawAuthor>("/users", { _fields: "id,name,slug,link,description,avatar_urls" })).map(mapAuthor);
}
