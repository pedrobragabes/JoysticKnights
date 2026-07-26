import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-config";
import { getAuthors, getCategories, getSitemapPages, getSitemapStories, getSitemapTags } from "@/lib/wordpress/queries";

const utilityPageSlugs = new Set(["inicio", "postagens", "pesquisar"]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [stories, pages, categories, tags, authors] = await Promise.all([
    getSitemapStories(),
    getSitemapPages(),
    getCategories(),
    getSitemapTags(),
    getAuthors(),
  ]);

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    ...pages
      .filter((page) => !utilityPageSlugs.has(page.slug))
      .map((page) => ({ url: `${siteUrl}${page.href}`, lastModified: page.modifiedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...categories.map((category) => ({ url: `${siteUrl}${category.href}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...tags.map((tag) => ({ url: `${siteUrl}${tag.href}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...authors.map((author) => ({ url: `${siteUrl}${author.href}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...stories.map((story) => ({
      url: `${siteUrl}${story.href}`,
      lastModified: story.modifiedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: story.image ? [story.image.url] : undefined,
    })),
  ];
}
