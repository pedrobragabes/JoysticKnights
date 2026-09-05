const PROFILE_NAMES = {
  promogames: "PromoGames",
  joysticknights: "JoystickNights",
};

const PROFILE_API_URLS = {
  promogames: "https://promogamesbr.com/wp-json/wp/v2",
  joysticknights: "https://cms.joysticknights.com.br/wp-json/wp/v2",
};

const SEARCH_STOP_WORDS = new Set([
  "ainda",
  "antes",
  "comeca",
  "contra",
  "depois",
  "entre",
  "games",
  "jogos",
  "noticias",
  "sobre",
  "temporada",
]);

function decodeHtmlEntities(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function plainText(value) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function normalizedSearchWord(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function resolveSiteProfile(value = process.env.NEXT_PUBLIC_SITE_PROFILE) {
  return value === "promogames" ? "promogames" : "joysticknights";
}

export function resolveWordPressApiUrl(profile = resolveSiteProfile()) {
  return (process.env.WORDPRESS_API_URL ?? PROFILE_API_URLS[profile]).replace(/\/$/, "");
}

export function normalizePathname(value) {
  const pathname = new URL(value, "https://wordpress.invalid").pathname.replace(/\/{2,}/g, "/");
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function getFrontendCategoryPath(profile, category) {
  return profile === "joysticknights"
    ? normalizePathname(category.link)
    : `/categoria/${category.slug}/`;
}

async function fetchJson(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response;
    try {
      response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
    } catch (error) {
      if (attempt === 2) throw error;
    }
    if (response?.ok) return response.json();
    if (response && (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2)) {
      throw new Error(`WordPress respondeu ${response.status} para ${url.pathname}`);
    }
    await response?.body?.cancel();
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  throw new Error("A origem editorial não respondeu.");
}

function chooseInstitutionalPage(pages) {
  const reserved = new Set(["api", "ads.txt", "autor", "buscar", "category", "categoria", "feed", "preview"]);
  const semanticPattern = /(about|contact|contato|cookies|privacidade|privacy|quem-somos|sobre|terms|termos)/;

  return pages
    .map((page) => {
      const path = normalizePathname(page.link);
      const segments = path.split("/").filter(Boolean);
      const contentLength = plainText(page.content?.rendered ?? "").length;
      const searchable = normalizedSearchWord(`${page.slug} ${plainText(page.title?.rendered ?? "")}`);
      const eligible = segments.length === 1 && !reserved.has(page.slug) && contentLength >= 40;
      const score = (semanticPattern.test(searchable) ? 1_000 : 0) + Math.min(contentLength, 500);
      return { page, path, eligible, score };
    })
    .filter((candidate) => candidate.eligible)
    .sort((left, right) => right.score - left.score)[0];
}

async function discoverSearchTerm(apiBase, story, title) {
  const candidates = [...new Set(
    title
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((word) => word.length >= 5 && !SEARCH_STOP_WORDS.has(normalizedSearchWord(word)))
      ?? [],
  )];

  for (const candidate of candidates) {
    const url = new URL(`${apiBase}/posts`);
    url.searchParams.set("include", String(story.id));
    url.searchParams.set("search", candidate);
    url.searchParams.set("per_page", "1");
    url.searchParams.set("_fields", "id");
    const matches = await fetchJson(url);
    if (matches.some((post) => post.id === story.id)) return candidate;
  }

  return story.slug.split("-").find((part) => part.length >= 5) ?? story.slug;
}

export async function discoverEditorialFixtures() {
  const profile = resolveSiteProfile();
  const apiBase = resolveWordPressApiUrl(profile);
  const [posts, categories, pages] = await Promise.all([
    fetchJson(new URL(`${apiBase}/posts?per_page=20&orderby=date&order=desc&_fields=id,slug,link,title,content,categories`)),
    fetchJson(new URL(`${apiBase}/categories?per_page=100&hide_empty=true&_fields=id,slug,link,name,parent,count`)),
    fetchJson(new URL(`${apiBase}/pages?per_page=100&status=publish&_fields=id,slug,link,title,content,parent`)),
  ]);

  const story = posts.find((post) => {
    const segmentCount = normalizePathname(post.link).split("/").filter(Boolean).length;
    return segmentCount >= 1 && segmentCount <= 3 && plainText(post.content?.rendered ?? "").length >= 100;
  });
  if (!story) throw new Error(`Nenhuma matéria renderizável foi encontrada em ${apiBase}.`);

  const availableCategories = categories
    .filter((category) => category.count > 0 && category.slug !== "uncategorized")
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      title: plainText(category.name),
      path: getFrontendCategoryPath(profile, category),
      count: category.count,
    }))
    .sort((left, right) => right.count - left.count);
  if (!availableCategories.length) throw new Error(`Nenhuma categoria com conteúdo foi encontrada em ${apiBase}.`);

  const institutional = chooseInstitutionalPage(pages);
  if (!institutional) throw new Error(`Nenhuma página institucional de raiz foi encontrada em ${apiBase}.`);

  const storyTitle = plainText(story.title.rendered);
  const searchTerm = await discoverSearchTerm(apiBase, story, storyTitle);

  return {
    profile,
    siteName: PROFILE_NAMES[profile],
    apiBase,
    story: {
      id: story.id,
      slug: story.slug,
      title: storyTitle,
      path: normalizePathname(story.link),
    },
    category: availableCategories[0],
    categories: availableCategories,
    page: {
      id: institutional.page.id,
      slug: institutional.page.slug,
      title: plainText(institutional.page.title.rendered),
      path: institutional.path,
    },
    searchTerm,
  };
}
