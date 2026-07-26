import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const defaultApiBase = process.env.NEXT_PUBLIC_SITE_PROFILE === "promogames"
  ? "https://promogamesbr.com/wp-json/wp/v2"
  : "https://joysticknights.com.br/wp-json/wp/v2";
const apiBase = (process.env.WORDPRESS_API_URL ?? defaultApiBase).replace(/\/$/, "");

async function request(path) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${path}`);
  }

  return {
    data: await response.json(),
    total: Number(response.headers.get("x-wp-total") ?? 0),
    totalPages: Number(response.headers.get("x-wp-totalpages") ?? 0),
  };
}

const [posts, categories, users] = await Promise.all([
  request(
    "/posts?per_page=12&_embed=author,wp:featuredmedia,wp:term" +
      "&_fields=id,slug,date,modified,title,excerpt,content,author," +
      "featured_media,categories,tags,_links,_embedded",
  ),
  request(
    "/categories?per_page=100&_fields=id,name,slug,parent,count,description",
  ),
  request("/users?per_page=100&_fields=id,name,slug,description,avatar_urls"),
]);

const sample = posts.data[0];
const report = {
  apiBase,
  checkedAt: new Date().toISOString(),
  totals: {
    posts: posts.total,
    postPages: posts.totalPages,
    categories: categories.total,
    users: users.total,
  },
  contract: {
    sampleSlug: sample?.slug ?? null,
    hasGutenbergContent: sample?.content?.rendered?.includes("wp-block-") ?? false,
    hasEmbeddedAuthor: Boolean(sample?._embedded?.author?.[0]),
    hasEmbeddedMedia: Boolean(sample?._embedded?.["wp:featuredmedia"]?.[0]),
    hasEmbeddedTerms: Boolean(sample?._embedded?.["wp:term"]?.length),
  },
  topCategories: categories.data
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map(({ id, name, slug, parent, count }) => ({
      id,
      name,
      slug,
      parent,
      count,
    })),
};

console.log(JSON.stringify(report, null, 2));
