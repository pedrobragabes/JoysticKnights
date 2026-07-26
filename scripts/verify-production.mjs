import nextEnv from "@next/env";
import { discoverEditorialFixtures } from "./editorial-fixtures.mjs";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const baseUrl = (
  process.argv[2]
  ?? process.env.VERIFY_URL
  ?? process.env.PROMOGAMES_VERIFY_URL
  ?? "http://localhost:3000"
).replace(/\/$/, "");
const fixture = await discoverEditorialFixtures();
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();

function includes(body, value) {
  return body.toLocaleLowerCase("pt-BR").includes(value.toLocaleLowerCase("pt-BR"));
}

const checks = [
  { name: "home", path: "/", statuses: [200], validate: (body) => includes(body, fixture.siteName) },
  { name: "categoria", path: fixture.category.path, statuses: [200], validate: (body) => includes(body, fixture.category.title) },
  { name: "busca", path: `/buscar/?q=${encodeURIComponent(fixture.searchTerm)}`, statuses: [200], validate: (body) => includes(body, "Resultados para") },
  { name: "matéria", path: fixture.story.path, statuses: [200], validate: (body) => body.includes("application/ld+json") && body.includes("NewsArticle") },
  { name: "institucional", path: fixture.page.path, statuses: [200], validate: (body) => includes(body, "Institucional") && includes(body, fixture.page.title) },
  { name: "feed", path: "/feed/", statuses: [200], validate: (body, response) => response.headers.get("content-type")?.includes("application/rss+xml") && body.includes(fixture.story.path) },
  {
    name: "ads.txt",
    path: "/ads.txt",
    statuses: adsenseClient && /^ca-pub-\d+$/.test(adsenseClient) ? [200] : [200, 404],
    validate: (body, response) => response.status === 404 || /^google\.com, pub-\d+, DIRECT,/m.test(body),
  },
  { name: "robots", path: "/robots.txt", statuses: [200], validate: (body) => body.includes("Sitemap:") },
  { name: "sitemap", path: "/sitemap.xml", statuses: [200], validate: (body) => body.includes(fixture.story.path) },
  { name: "draft protegido", path: "/api/draft/?id=1&secret=invalido", statuses: [401], validate: (body) => includes(body, "autorizado") },
];

const results = [];
for (const check of checks) {
  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });
    const body = await response.text();
    const passed = check.statuses.includes(response.status) && Boolean(check.validate(body, response));
    results.push({
      name: check.name,
      path: check.path,
      status: response.status,
      expectedStatuses: check.statuses,
      durationMs: Math.round(performance.now() - startedAt),
      passed,
    });
  } catch (error) {
    results.push({
      name: check.name,
      path: check.path,
      durationMs: Math.round(performance.now() - startedAt),
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

console.log(JSON.stringify({
  baseUrl,
  profile: fixture.profile,
  apiBase: fixture.apiBase,
  checkedAt: new Date().toISOString(),
  fixtures: { story: fixture.story.path, category: fixture.category.path, page: fixture.page.path, searchTerm: fixture.searchTerm },
  results,
}, null, 2));
if (results.some((result) => !result.passed)) process.exitCode = 1;
