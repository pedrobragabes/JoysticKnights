import "server-only";

import { cache } from "react";
import { getWordPressRestUrl, wordPressRequest } from "./client";
import { fallbackStories } from "./fallback";
import { mapAuthor, mapComment, mapPage, mapPost, mapTerm } from "./mappers";
import type { RawAuthor, RawCategory, RawComment, RawPage, RawPost, RawTag } from "./raw-types";
import type { Paginated, Story, StoryQuery, WordPressAuthor, WordPressComment, WordPressPage, WordPressTerm } from "./types";

const LIST_FIELDS = [
  "id",
  "date",
  "modified",
  "slug",
  "link",
  "title",
  "excerpt",
  "author",
  "featured_media",
  "comment_status",
  "categories",
  "tags",
  "meta",
  "promogames_seo",
  "_links",
  "_embedded",
].join(",");

const DETAIL_FIELDS = `${LIST_FIELDS},content`;
const PAGE_LIST_FIELDS = "id,date,modified,slug,link,title,excerpt,parent,menu_order,promogames_seo";
const PAGE_DETAIL_FIELDS = `${PAGE_LIST_FIELDS},content`;
const COMMENT_FIELDS = "id,post,parent,author_name,date,content,status,type";
const TERM_FIELDS = "id,name,slug,link,taxonomy,parent,count,description";
const EMBED = "author,wp:featuredmedia,wp:term";

export async function getStories(query: StoryQuery = {}): Promise<Paginated<Story>> {
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(24, Math.max(1, query.perPage ?? 12));

  try {
    const response = await wordPressRequest<RawPost[]>(
      "/posts",
      {
        page,
        per_page: perPage,
        search: query.search,
        categories: query.categoryId,
        tags: query.tagId,
        author: query.authorId,
        exclude: query.exclude,
        sticky: query.sticky,
        _embed: EMBED,
        _fields: LIST_FIELDS,
      },
      ["wordpress", "stories"],
    );

    return {
      items: response.data.map(mapPost),
      page,
      perPage,
      total: response.total,
      totalPages: response.totalPages,
    };
  } catch (error) {
    console.error("[wordpress] Falha ao carregar matérias", error);
    const items = page === 1 && !query.search && !query.categoryId && !query.tagId && !query.authorId
      ? fallbackStories.slice(0, perPage)
      : [];
    return { items, page, perPage, total: items.length, totalPages: items.length ? 1 : 0 };
  }
}

const getCuratedStories = cache(async (perPage: number): Promise<Story[]> => {
  try {
    const url = getWordPressRestUrl("promogames/v1/home");
    url.searchParams.set("per_page", String(Math.min(12, Math.max(1, perPage))));
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300, tags: ["wordpress", "stories", "home"] },
    });
    if (!response.ok) return [];

    const payload = await response.json() as { items?: Array<{ id?: number }> };
    const ids = [...new Set((payload.items ?? []).map((item) => item.id).filter((id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0))];
    if (!ids.length) return [];

    const posts = await wordPressRequest<RawPost[]>(
      "/posts",
      {
        include: ids,
        orderby: "include",
        per_page: ids.length,
        _embed: EMBED,
        _fields: LIST_FIELDS,
      },
      ["wordpress", "stories", "home"],
    );
    return posts.data.map(mapPost);
  } catch {
    // The route only exists after PromoGames Core is activated; latest stories remain the safe fallback.
    return [];
  }
});

export async function getHomepageStories(perPage = 18): Promise<Paginated<Story>> {
  const safePerPage = Math.min(24, Math.max(4, perPage));
  const [recent, curated] = await Promise.all([
    getStories({ perPage: safePerPage }),
    getCuratedStories(Math.min(4, safePerPage)),
  ]);
  if (!curated.length) return recent;

  const seen = new Set(curated.map((story) => story.id));
  return {
    ...recent,
    items: [...curated, ...recent.items.filter((story) => !seen.has(story.id))].slice(0, safePerPage),
  };
}

export const getStoryBySlug = cache(async (slug: string): Promise<Story | null> => {
  try {
    const response = await wordPressRequest<RawPost[]>(
      "/posts",
      {
        slug,
        per_page: 1,
        _embed: EMBED,
        _fields: DETAIL_FIELDS,
      },
      ["wordpress", "stories", `story:${slug}`],
    );
    return response.data[0] ? mapPost(response.data[0]) : null;
  } catch (error) {
    console.error(`[wordpress] Falha ao carregar matéria ${slug}`, error);
    return fallbackStories.find((story) => story.slug === slug) ?? null;
  }
});

export const getPageBySlug = cache(async (slug: string): Promise<WordPressPage | null> => {
  try {
    const response = await wordPressRequest<RawPage[]>(
      "/pages",
      { slug, per_page: 1, _fields: PAGE_DETAIL_FIELDS },
      ["wordpress", "pages", `page:${slug}`],
    );
    return response.data[0] ? mapPage(response.data[0]) : null;
  } catch (error) {
    console.error(`[wordpress] Falha ao carregar página ${slug}`, error);
    return null;
  }
});

export const getCommentsByPostId = cache(async (postId: number): Promise<WordPressComment[]> => {
  if (!Number.isInteger(postId) || postId < 1) return [];

  try {
    const response = await wordPressRequest<RawComment[]>(
      "/comments",
      {
        post: postId,
        status: "approve",
        type: "comment",
        order: "asc",
        orderby: "date",
        per_page: 100,
        _fields: COMMENT_FIELDS,
      },
      ["wordpress", "comments", `comments:${postId}`],
    );
    return response.data
      .filter((comment) => comment.status === "approved" && comment.type === "comment")
      .map(mapComment);
  } catch (error) {
    console.error("[wordpress] Falha ao carregar comentários", error);
    return [];
  }
});

function getPreviewAuthorization() {
  const username = process.env.WORDPRESS_USERNAME;
  const password = process.env.WORDPRESS_APPLICATION_PASSWORD;
  if (!username || !password) return null;
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

export async function getPreviewStoryById(id: number): Promise<Story | null> {
  const authorization = getPreviewAuthorization();
  if (!authorization || !Number.isInteger(id) || id < 1) return null;

  try {
    const response = await wordPressRequest<RawPost>(
      `/posts/${id}`,
      { context: "edit", _embed: EMBED, _fields: DETAIL_FIELDS },
      [],
      { cache: "no-store", headers: { Authorization: authorization } },
    );
    return mapPost(response.data);
  } catch (error) {
    console.error(`[wordpress] Falha ao carregar preview ${id}`, error);
    return null;
  }
}

type SitemapStory = Pick<Story, "id" | "slug" | "href" | "modifiedAt" | "image">;

export const getSitemapStories = cache(async (): Promise<SitemapStory[]> => {
  const stories: SitemapStory[] = [];
  let page = 1;
  let totalPages = 1;

  try {
    do {
      const response = await wordPressRequest<RawPost[]>(
        "/posts",
        { page, per_page: 100, _embed: "wp:featuredmedia", _fields: LIST_FIELDS },
        ["wordpress", "stories"],
      );
      stories.push(...response.data.map(mapPost));
      totalPages = Math.min(response.totalPages, 20);
      page += 1;
    } while (page <= totalPages);
    return stories;
  } catch (error) {
    console.error("[wordpress] Falha ao montar sitemap", error);
    return stories.length ? stories : fallbackStories;
  }
});

type SitemapPage = Pick<WordPressPage, "id" | "slug" | "href" | "modifiedAt">;

export const getSitemapPages = cache(async (): Promise<SitemapPage[]> => {
  const pages: SitemapPage[] = [];
  let page = 1;
  let totalPages = 1;

  try {
    do {
      const response = await wordPressRequest<RawPage[]>(
        "/pages",
        { page, per_page: 100, status: "publish", _fields: PAGE_LIST_FIELDS },
        ["wordpress", "pages"],
      );
      pages.push(...response.data.map(mapPage));
      totalPages = Math.min(response.totalPages, 20);
      page += 1;
    } while (page <= totalPages);
    return pages;
  } catch (error) {
    console.error("[wordpress] Falha ao montar páginas do sitemap", error);
    return pages;
  }
});

export const getCategories = cache(async (): Promise<WordPressTerm[]> => {
  try {
    const response = await wordPressRequest<RawCategory[]>(
      "/categories",
      { per_page: 100, hide_empty: true, _fields: TERM_FIELDS },
      ["wordpress", "categories"],
    );
    return response.data.map(mapTerm).sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  } catch (error) {
    console.error("[wordpress] Falha ao carregar categorias", error);
    return [];
  }
});

export const getCategoryBySlug = cache(async (slug: string): Promise<WordPressTerm | null> => {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug) ?? null;
});

export const getTags = cache(async (): Promise<WordPressTerm[]> => {
  try {
    const response = await wordPressRequest<RawTag[]>(
      "/tags",
      { per_page: 100, hide_empty: true, _fields: TERM_FIELDS },
      ["wordpress", "tags"],
    );
    return response.data.map(mapTerm).sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  } catch (error) {
    console.error("[wordpress] Falha ao carregar tags", error);
    return [];
  }
});

export const getSitemapTags = cache(async (): Promise<WordPressTerm[]> => {
  const tags: WordPressTerm[] = [];
  let page = 1;
  let totalPages = 1;

  try {
    do {
      const response = await wordPressRequest<RawTag[]>(
        "/tags",
        { page, per_page: 100, hide_empty: true, _fields: TERM_FIELDS },
        ["wordpress", "tags"],
      );
      tags.push(...response.data.map(mapTerm));
      totalPages = Math.min(response.totalPages, 20);
      page += 1;
    } while (page <= totalPages);
    return tags;
  } catch (error) {
    console.error("[wordpress] Falha ao carregar tags do sitemap", error);
    return tags;
  }
});

export const getTagBySlug = cache(async (slug: string): Promise<WordPressTerm | null> => {
  try {
    const response = await wordPressRequest<RawTag[]>(
      "/tags",
      { slug, per_page: 1, _fields: TERM_FIELDS },
      ["wordpress", "tags", `tag:${slug}`],
    );
    return response.data[0] ? mapTerm(response.data[0]) : null;
  } catch (error) {
    console.error(`[wordpress] Falha ao carregar tag ${slug}`, error);
    return null;
  }
});

export const getAuthors = cache(async (): Promise<WordPressAuthor[]> => {
  try {
    const response = await wordPressRequest<RawAuthor[]>(
      "/users",
      { per_page: 100, _fields: "id,name,slug,link,description,avatar_urls" },
      ["wordpress", "authors"],
    );
    return response.data.map(mapAuthor);
  } catch (error) {
    console.error("[wordpress] Falha ao carregar autores", error);
    return [];
  }
});

export const getAuthorBySlug = cache(async (slug: string): Promise<WordPressAuthor | null> => {
  const authors = await getAuthors();
  return authors.find((author) => author.slug === slug) ?? null;
});
