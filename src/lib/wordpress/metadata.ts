import type { Metadata } from "next";
import { getSiteUrl, siteConfig } from "../site-config";
import type { Story, WordPressAuthor, WordPressPage, WordPressTerm } from "./types";

const DEFAULT_SOCIAL_IMAGE = "/og.png";

function getPaginatedHref(href: string, page: number) {
  if (page <= 1) return href;
  return `${href}${href.includes("?") ? "&" : "?"}page=${page}`;
}

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/\/{2,}/g, "/");
  return normalized === "/" ? normalized : normalized.replace(/\/$/, "");
}

function getInternalHosts(sourceUrl?: string) {
  return new Set([
    getSiteUrl(),
    siteConfig.defaultSiteUrl,
    process.env.WORDPRESS_API_URL ?? siteConfig.defaultWordPressApiUrl,
    sourceUrl,
  ].flatMap((value) => {
    if (!value) return [];
    try {
      return [new URL(value).hostname.replace(/^www\./, "")];
    } catch {
      return [];
    }
  }));
}

function getCanonicalHref(candidate: string | undefined, fallback: string, sourceUrl?: string) {
  if (!candidate) return fallback;

  try {
    const url = new URL(candidate, getSiteUrl());
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;

    const isRelative = candidate.startsWith("/") && !candidate.startsWith("//");
    const isInternal = isRelative || getInternalHosts(sourceUrl).has(url.hostname.replace(/^www\./, ""));
    if (!isInternal) return candidate;

    const fallbackUrl = new URL(fallback, getSiteUrl());
    if (normalizePathname(url.pathname) !== normalizePathname(fallbackUrl.pathname)) return fallback;

    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

function getSocialImage(story: Story) {
  const url = story.seo?.socialImage ?? story.image?.url;
  if (!url) {
    return [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: story.title }];
  }

  if (story.image?.url === url) {
    return [{
      url,
      width: story.image.width,
      height: story.image.height,
      alt: story.image.alt || story.title,
    }];
  }

  return [{ url, alt: story.title }];
}

export function getStoryMetadata(story: Story): Metadata {
  const title = story.seo?.title ?? story.title;
  const description = story.seo?.description ?? story.deck ?? story.excerpt;
  const canonical = getCanonicalHref(story.seo?.canonical, story.href, story.sourceUrl);
  const images = getSocialImage(story);

  return {
    title: story.seo?.title ? { absolute: story.seo.title } : story.title,
    description,
    authors: [{ name: story.author.name, url: story.author.href }],
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: "pt_BR",
      siteName: siteConfig.name,
      url: canonical,
      title,
      description,
      publishedTime: story.publishedAt,
      modifiedTime: story.modifiedAt,
      authors: [story.author.name],
      tags: [...story.categories, ...story.tags].map((term) => term.name),
      images,
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

function getCollectionMetadata(title: string, description: string, canonical: string, profileUsername?: string): Metadata {
  const socialMetadata = {
    locale: "pt_BR",
    siteName: siteConfig.name,
    url: canonical,
    title,
    description,
    images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: title }],
  };

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: profileUsername
      ? { type: "profile", username: profileUsername, ...socialMetadata }
      : { type: "website", ...socialMetadata },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      title,
      description,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

export function getCategoryMetadata(category: WordPressTerm, page = 1): Metadata {
  const title = `${category.name}${page > 1 ? ` — Página ${page}` : ""}`;
  const description = category.description || `Notícias, análises e novidades de ${category.name} no ${siteConfig.name}.`;
  const canonical = getPaginatedHref(category.href, page);

  return getCollectionMetadata(title, description, canonical);
}

export function getTagMetadata(tag: WordPressTerm, page = 1): Metadata {
  const title = `${tag.name}${page > 1 ? ` — Página ${page}` : ""}`;
  const description = tag.description || `Matérias sobre ${tag.name} no ${siteConfig.name}.`;

  return getCollectionMetadata(title, description, getPaginatedHref(tag.href, page));
}

export function getAuthorMetadata(author: WordPressAuthor, page = 1): Metadata {
  const title = `${author.name}${page > 1 ? ` — Página ${page}` : ""}`;
  const description = author.description || `Leia as matérias de ${author.name} no ${siteConfig.name}.`;

  return getCollectionMetadata(title, description, getPaginatedHref(author.href, page), author.slug);
}

export function getPageMetadata(page: WordPressPage): Metadata {
  const title = page.seo?.title ?? page.title;
  const description = page.seo?.description ?? (page.excerpt || undefined);
  const canonical = getCanonicalHref(page.seo?.canonical, page.href, page.sourceUrl);
  const socialImage = page.seo?.socialImage ?? DEFAULT_SOCIAL_IMAGE;

  return {
    title: page.seo?.title ? { absolute: page.seo.title } : page.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: siteConfig.name,
      url: canonical,
      title,
      description,
      images: [{
        url: socialImage,
        ...(socialImage === DEFAULT_SOCIAL_IMAGE ? { width: 1200, height: 630 } : {}),
        alt: page.title,
      }],
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      title,
      description,
      images: [socialImage],
    },
  };
}
