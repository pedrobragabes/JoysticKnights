import type { RawAuthor, RawCategory, RawComment, RawMedia, RawPage, RawPost, RawSeo, RawTag, RawTerm } from "./raw-types";
import { siteConfig } from "../site-config";
import { decodeHtmlEntities, plainText, readingTime, truncateText } from "./text";
import type { Story, WordPressAuthor, WordPressComment, WordPressImage, WordPressPage, WordPressSeo, WordPressTerm } from "./types";

const fallbackAuthor: WordPressAuthor = {
  id: 0,
  name: siteConfig.newsroomLabel,
  slug: `redacao-${siteConfig.profile}`,
  href: `/autor/redacao-${siteConfig.profile}/`,
  description: "Notícias, análises e guias para quem vive videogames.",
};

export function mapAuthor(author?: RawAuthor): WordPressAuthor {
  if (!author) return fallbackAuthor;

  return {
    id: author.id,
    name: decodeHtmlEntities(author.name),
    slug: author.slug,
    href: getLocalHref(author.link, `/autor/${author.slug}/`),
    sourceUrl: author.link,
    description: plainText(author.description ?? ""),
    avatarUrl: author.avatar_urls?.["96"] ?? author.avatar_urls?.["48"],
  };
}

export function getLocalHref(link: string | undefined, fallback: string) {
  try {
    const url = new URL(link ?? "", "https://wordpress.invalid");
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;

    const pathname = url.pathname.replace(/\/{2,}/g, "/");
    if (!pathname.startsWith("/") || pathname === "/") return fallback;
    return pathname.endsWith("/") ? pathname : `${pathname}/`;
  } catch {
    return fallback;
  }
}

export function getHrefSegments(href: string) {
  return href.split("/").filter(Boolean).map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
}

function getSeoUrl(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return undefined;

  try {
    const isRelative = candidate.startsWith("/") && !candidate.startsWith("//");
    const url = new URL(candidate, "https://wordpress.invalid");
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    url.hash = "";
    return isRelative ? `${url.pathname}${url.search}` : url.toString();
  } catch {
    return undefined;
  }
}

export function mapSeo(seo?: RawSeo): WordPressSeo | undefined {
  if (!seo) return undefined;

  const mapped: WordPressSeo = {
    title: plainText(seo.title ?? "") || undefined,
    description: plainText(seo.description ?? "") || undefined,
    canonical: getSeoUrl(seo.canonical),
    socialImage: getSeoUrl(seo.social_image),
  };
  return Object.values(mapped).some(Boolean) ? mapped : undefined;
}

export function mapTerm(term: RawTerm | RawCategory | RawTag): WordPressTerm {
  const taxonomy = term.taxonomy ?? "category";
  const fallbackHref = taxonomy === "post_tag"
    ? `/tag/${term.slug}/`
    : taxonomy === "category"
      ? `/categoria/${term.slug}/`
      : `/${taxonomy}/${term.slug}/`;

  return {
    id: term.id,
    name: decodeHtmlEntities(term.name),
    slug: term.slug,
    href: getLocalHref(term.link, fallbackHref),
    sourceUrl: term.link,
    taxonomy,
    parent: term.parent,
    count: term.count,
    description: plainText(term.description ?? ""),
  };
}

function mapImage(media?: RawMedia): WordPressImage | undefined {
  if (!media?.source_url) return undefined;

  const preferred =
    media.media_details?.sizes?.large ?? media.media_details?.sizes?.full;

  return {
    url: preferred?.source_url ?? media.source_url,
    width: preferred?.width ?? media.media_details?.width ?? 1600,
    height: preferred?.height ?? media.media_details?.height ?? 900,
    alt: plainText(media.alt_text ?? ""),
    caption: plainText(media.caption?.rendered ?? "") || undefined,
  };
}

function getTerms(post: RawPost) {
  return (post._embedded?.["wp:term"] ?? []).flat().map(mapTerm);
}

function toBoolean(value: boolean | string | number | undefined) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function toPlatforms(value: string[] | string | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

export function mapPost(post: RawPost): Story {
  const terms = getTerms(post);
  const categories = terms.filter((term) => term.taxonomy === "category");
  const tags = terms.filter((term) => term.taxonomy === "post_tag");
  const content = post.content?.rendered ?? "";
  const primaryCategory =
    categories.find((category) => category.slug !== "noticias") ?? categories[0];
  const rawScore = post.meta?.promogames_review_score;
  const reviewScore = rawScore === undefined || rawScore === "" ? undefined : Number(rawScore);

  return {
    id: post.id,
    slug: post.slug,
    href: getLocalHref(post.link, `/${post.slug}/`),
    sourceUrl: post.link,
    title: plainText(post.title.rendered),
    excerpt: truncateText(post.excerpt.rendered),
    content,
    deck: plainText(post.meta?.promogames_deck ?? "") || undefined,
    publishedAt: post.date,
    modifiedAt: post.modified,
    author: mapAuthor(post._embedded?.author?.[0]),
    image: mapImage(post._embedded?.["wp:featuredmedia"]?.[0]),
    seo: mapSeo(post.promogames_seo),
    commentStatus: post.comment_status === "open" ? "open" : "closed",
    categories,
    tags,
    primaryCategory,
    readingMinutes: readingTime(content || post.excerpt.rendered),
    editorialType: post.meta?.promogames_editorial_type,
    platforms: toPlatforms(post.meta?.promogames_platforms),
    reviewScore: Number.isFinite(reviewScore) ? reviewScore : undefined,
    featured: toBoolean(post.meta?.promogames_featured),
  };
}

export function mapPage(page: RawPage): WordPressPage {
  return {
    id: page.id,
    slug: page.slug,
    href: getLocalHref(page.link, `/${page.slug}/`),
    sourceUrl: page.link,
    title: plainText(page.title.rendered),
    excerpt: truncateText(page.excerpt?.rendered ?? ""),
    content: page.content?.rendered ?? "",
    publishedAt: page.date,
    modifiedAt: page.modified,
    parentId: page.parent,
    menuOrder: page.menu_order,
    seo: mapSeo(page.promogames_seo),
  };
}

export function mapComment(comment: RawComment): WordPressComment {
  return {
    id: comment.id,
    postId: comment.post,
    parentId: comment.parent,
    authorName: plainText(comment.author_name) || "Visitante",
    publishedAt: comment.date,
    content: comment.content.rendered,
  };
}
