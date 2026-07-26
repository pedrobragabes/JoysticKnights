import type { Metadata } from "next";
import { getSiteUrl, siteConfig } from "../site-config";
import type { Story, WordPressAuthor, WordPressPage, WordPressTerm } from "./types";

function getPaginatedHref(href: string, page: number) {
  if (page <= 1) return href;
  return `${href}${href.includes("?") ? "&" : "?"}page=${page}`;
}

function getCanonicalHref(candidate: string | undefined, fallback: string) {
  if (!candidate) return fallback;
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;

  try {
    const url = new URL(candidate);
    const internalHosts = [
      getSiteUrl(),
      siteConfig.defaultSiteUrl,
      process.env.WORDPRESS_API_URL ?? siteConfig.defaultWordPressApiUrl,
    ].flatMap((value) => {
      try {
        return [new URL(value).hostname.replace(/^www\./, "")];
      } catch {
        return [];
      }
    });

    if (internalHosts.includes(url.hostname.replace(/^www\./, ""))) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    return fallback;
  }

  return candidate;
}

function getSocialImage(story: Story) {
  const url = story.seo?.socialImage ?? story.image?.url;
  if (!url) return undefined;

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
  const canonical = getCanonicalHref(story.seo?.canonical, story.href);
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
      title,
      description,
      images: images?.map((image) => image.url),
    },
  };
}

export function getCategoryMetadata(category: WordPressTerm, page = 1): Metadata {
  const title = `${category.name}${page > 1 ? ` — Página ${page}` : ""}`;
  const description = category.description || `Notícias, análises e novidades de ${category.name} no ${siteConfig.name}.`;
  const canonical = getPaginatedHref(category.href, page);

  return { title, description, alternates: { canonical } };
}

export function getTagMetadata(tag: WordPressTerm, page = 1): Metadata {
  const title = `${tag.name}${page > 1 ? ` — Página ${page}` : ""}`;
  const description = tag.description || `Matérias sobre ${tag.name} no ${siteConfig.name}.`;

  return { title, description, alternates: { canonical: getPaginatedHref(tag.href, page) } };
}

export function getAuthorMetadata(author: WordPressAuthor, page = 1): Metadata {
  const title = `${author.name}${page > 1 ? ` — Página ${page}` : ""}`;
  const description = author.description || `Leia as matérias de ${author.name} no ${siteConfig.name}.`;

  return { title, description, alternates: { canonical: getPaginatedHref(author.href, page) } };
}

export function getPageMetadata(page: WordPressPage): Metadata {
  const title = page.seo?.title ?? page.title;
  const description = page.seo?.description ?? (page.excerpt || undefined);
  const canonical = getCanonicalHref(page.seo?.canonical, page.href);
  const socialImage = page.seo?.socialImage;

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
      images: socialImage ? [{ url: socialImage, alt: page.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: socialImage ? [socialImage] : undefined,
    },
  };
}
