import { getSiteUrl, siteConfig } from "@/lib/site-config";
import { getStories } from "@/lib/wordpress/queries";

export const revalidate = 300;

function xml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
export async function GET() {
  const siteUrl = getSiteUrl();
  const { items } = await getStories({ perPage: 20 });
  const entries = items.map((story) => `
    <item>
      <title>${xml(story.title)}</title>
      <link>${xml(`${siteUrl}${story.href}`)}</link>
      <guid isPermaLink="true">${xml(`${siteUrl}${story.href}`)}</guid>
      <pubDate>${new Date(story.publishedAt).toUTCString()}</pubDate>
      <dc:creator>${xml(story.author.name)}</dc:creator>
      <description>${xml(story.excerpt)}</description>
      ${story.categories.map((category) => `<category>${xml(category.name)}</category>`).join("\n      ")}
    </item>`).join("");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xml(siteConfig.name)}</title>
    <link>${xml(siteUrl)}</link>
    <description>${xml(siteConfig.shortDescription)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${xml(`${siteUrl}/feed/`)}" rel="self" type="application/rss+xml" />${entries}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
