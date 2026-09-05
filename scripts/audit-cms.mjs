import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

function getCmsOrigin() {
  const explicit = process.argv[2] ?? process.env.CMS_AUDIT_URL;
  if (explicit) return new URL(explicit).origin;

  const apiUrl = new URL(process.env.WORDPRESS_API_URL ?? "https://cms.joysticknights.com.br/wp-json/wp/v2");
  return apiUrl.origin;
}

const cmsOrigin = getCmsOrigin();
const checks = [];

async function check(name, path, validate, init = {}) {
  const startedAt = performance.now();
  try {
    const target = new URL(path, cmsOrigin);
    const response = await fetch(target, {
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
      ...init,
    });
    const body = init.method === "HEAD" ? "" : await response.text();
    const detail = validate(response, body);
    checks.push({
      name,
      path,
      status: response.status,
      durationMs: Math.round(performance.now() - startedAt),
      passed: detail === true,
      ...(typeof detail === "string" ? { detail } : {}),
    });
    return { response, body };
  } catch (error) {
    checks.push({
      name,
      path,
      durationMs: Math.round(performance.now() - startedAt),
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

await check("frontend legado redirecionado", "/", (response) => {
  const location = response.headers.get("location");
  if (![301, 308].includes(response.status)) return "A raiz do CMS deve responder 301/308.";
  if (!location) return "O redirect não informou Location.";
  return new URL(location, cmsOrigin).origin !== cmsOrigin || "O redirect continua no host do CMS.";
});

await check("X-Robots-Tag", "/", (response) => {
  const robots = response.headers.get("x-robots-tag")?.toLowerCase() ?? "";
  return robots.includes("noindex") && robots.includes("nofollow") || "O header precisa conter noindex e nofollow.";
});

await check("robots permite descobrir redirects", "/robots.txt", (response, body) => {
  return response.status === 200 && !/^disallow:\s*\/$/im.test(body) && !/^sitemap:/im.test(body) || "robots.txt deve permitir ler os redirects/noindex e não anunciar sitemap do CMS.";
});

const restResult = await check("REST preservado", "/wp-json/wp/v2/posts?per_page=1&_embed=wp:featuredmedia&_fields=id,slug,link,_links,_embedded", (response, body) => {
  if (response.status !== 200) return "A API de posts deve responder 200.";
  try {
    const posts = JSON.parse(body);
    return Array.isArray(posts) && posts.length > 0 || "A API não retornou um post público.";
  } catch {
    return "A API não retornou JSON válido.";
  }
});

if (restResult) {
  try {
    const mediaUrl = JSON.parse(restResult.body)?.[0]?._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    if (typeof mediaUrl === "string" && mediaUrl !== "") {
      await check("mídia preservada", mediaUrl, (response) => response.status === 200 || "A mídia destacada mais recente deve responder 200.", { method: "HEAD" });
    } else {
      checks.push({ name: "mídia preservada", path: "(sem fixture)", passed: false, detail: "O post mais recente não expôs mídia destacada para o smoke test." });
    }
  } catch {
    checks.push({ name: "mídia preservada", path: "(fixture inválida)", passed: false, detail: "Não foi possível descobrir uma mídia pela resposta REST." });
  }
}

await check("admin preservado", "/wp-admin/", (response) => {
  return [200, 302, 307].includes(response.status) || "wp-admin deve abrir ou redirecionar para o login.";
});

await check("feed desativado", "/feed/", (response) => response.status === 410 || "O feed do CMS deve responder 410.");
await check("sitemap WordPress desativado", "/wp-sitemap.xml", (response) => response.status === 410 || "wp-sitemap.xml deve responder 410.");
await check("sitemap SEO desativado", "/sitemap.xml", (response) => response.status === 410 || "sitemap.xml deve responder 410.");

console.log(JSON.stringify({ cmsOrigin, checkedAt: new Date().toISOString(), checks }, null, 2));
if (checks.some((item) => !item.passed)) process.exitCode = 1;
