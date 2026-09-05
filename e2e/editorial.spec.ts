import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { escapeRegExp, getEditorialFixture, normalizePathname } from "./editorial-fixture";

const storedRefusal = JSON.stringify({
  version: 1,
  statistics: false,
  marketing: false,
  updatedAt: "2026-07-26T18:00:00.000Z",
});

test.beforeEach(async ({ context }) => {
  await context.addInitScript((consent) => {
    try {
      window.localStorage.setItem("editorial-site-consent", consent);
    } catch {
      // Storage may be unavailable in opaque third-party frames.
    }
  }, storedRefusal);
});

test("home apresenta o perfil e conteúdo editorial atual", async ({ page }) => {
  const fixture = getEditorialFixture();
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.locator("main h1").first()).toBeVisible();
  await expect(page.locator(`main a[href="${fixture.story.path}"]`).first()).toBeVisible();
  await expect(page.getByRole("dialog", { name: /dados|privacidade/i })).toHaveCount(0);
  await expect(page.locator('script[src*="googletagmanager"], script[src*="adsbygoogle"]')).toHaveCount(0);

  const violations = await new AxeBuilder({ page }).analyze();
  expect(violations.violations.filter((item) => item.impact === "critical")).toEqual([]);
});

test("home continua o feed em URLs paginadas sem repetir os blocos editoriais", async ({ page }) => {
  await page.goto("/");

  const heroLinks = await page.getByTestId("featured-carousel").getByRole("link").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  const feedSection = page.locator("section").filter({ has: page.getByRole("heading", { name: "Acabou de sair", exact: true }) });
  const feedLinks = await feedSection.locator("article a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(feedLinks.length).toBeGreaterThan(0);
  expect(feedLinks.some((href) => heroLinks.includes(href))).toBe(true);

  const pagination = page.getByRole("navigation", { name: "Paginação" });
  await expect(pagination).toBeVisible();
  await pagination.getByRole("link", { name: "Próxima" }).click();
  await expect(page).toHaveURL(/\/page\/2\/$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/page\/2\/$/);
  await expect(page.getByRole("heading", { name: "Acabou de sair — página 2" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No controle agora" })).toHaveCount(0);
});

test("destaques navegam como carrossel por controles e indicadores", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByTestId("featured-carousel");
  await carousel.hover();
  await expect(carousel.getByRole("button", { name: "Próximo destaque" })).toBeVisible();
  await carousel.getByRole("button", { name: "Próximo destaque" }).click();
  await expect(carousel.getByRole("button", { name: "Ir para destaque 2" })).toHaveAttribute("aria-current", "true");
  await expect(carousel.getByRole("link").nth(1)).toBeVisible();
});

test("tema começa escuro, alterna para claro e preserva a escolha", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Ativar modo claro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Ativar modo escuro" })).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("busca usa um termo confirmado pela API editorial", async ({ page }) => {
  const { searchTerm } = getEditorialFixture();
  await page.goto(`/buscar/?q=${encodeURIComponent(searchTerm)}`);

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Resultados para");
  await expect(page.getByLabel("Buscar no JoystickNights", { exact: true })).toHaveValue(searchTerm);
  await expect(page.locator("main article").first()).toBeVisible();
});

test("paginação fora do acervo responde 404 e busca mantém os filtros", async ({ page }) => {
  const response = await page.goto("/page/99999/");
  expect(response?.status()).toBe(404);
  await page.goto("/buscar/?q=Modern&platform=pc");
  await expect(page.getByLabel("Plataforma", { exact: true })).toHaveValue("pc");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("arquivo tem canonical e links próprios na página 2", async ({ page }) => {
  const fixture = getEditorialFixture();
  const category = fixture.categories.find((item) => item.path.includes("noticias"));
  test.skip(!category, "O perfil não tem categoria notícias.");
  const response = await page.goto(`${category!.path}page/2/`);
  expect(response?.status()).toBe(200);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/page\/2\/$/);
  await expect(page.getByRole("navigation", { name: "Paginação" }).getByRole("link", { name: "Anterior" })).toHaveAttribute("href", category!.path);
});

test("matérias antigas presentes no CMS não viram 404", async ({ page }) => {
  for (const path of ["/noticias/demo-de-yakuza-kiwami-3-ja-disponivel/", "/analises/review-assassins-creed-shadows-entre-o-stealth-e-a-mesmice/"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${escapeRegExp(path)}$`));
    if (path.startsWith("/analises/")) await expect(page.getByRole("region", { name: "Resumo da análise" })).toBeVisible();
  }
});

test("navegação abre uma categoria existente no perfil", async ({ page, isMobile }) => {
  const fixture = getEditorialFixture();
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "Abrir menu" }).click();

  const navigation = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(navigation).toBeVisible();
  const links = navigation.getByRole("link");
  let selected: { title: string; path: string } | undefined;
  let selectedLink = links.first();

  for (let index = 0; index < await links.count(); index += 1) {
    const candidate = links.nth(index);
    const href = await candidate.getAttribute("href");
    if (!href) continue;
    const category = fixture.categories.find((item) => item.path === normalizePathname(new URL(href, "http://local.test").pathname));
    if (!category) continue;
    selected = category;
    selectedLink = candidate;
    break;
  }

  expect(selected, "A navegação deve compartilhar ao menos uma categoria com o WordPress.").toBeTruthy();
  if (!selected) return;
  await selectedLink.click();
  await page.waitForURL((url) => normalizePathname(url.pathname) === selected?.path);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(new RegExp(escapeRegExp(selected.title), "i"));
});

test("matéria atual renderiza conteúdo e oculta publicidade sem consentimento", async ({ page }) => {
  const { story } = getEditorialFixture();
  const response = await page.goto(story.path);

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(new RegExp(escapeRegExp(story.title), "i"));
  await expect(page.locator(".article-body")).not.toBeEmpty();
  await expect(page.getByText("Sobre o autor")).toBeVisible();
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain("NewsArticle");
  await expect(page.getByLabel("Publicidade")).toHaveCount(0);

  const violations = await new AxeBuilder({ page }).analyze();
  expect(violations.violations.filter((item) => item.impact === "critical")).toEqual([]);
});

test("imagens da matéria abrem galeria navegável", async ({ page }) => {
  const { story } = getEditorialFixture();
  await page.goto(story.path);
  const articleImages = page.locator('.article-body img[role="button"]');
  test.skip(await articleImages.count() === 0, "A matéria editorial descoberta não contém galeria.");

  await articleImages.first().click();
  const dialog = page.getByRole("dialog", { name: "Galeria de imagens da matéria" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Fechar galeria" })).toBeFocused();
  const imageCount = await articleImages.count();
  if (imageCount > 1) {
    await dialog.getByRole("button", { name: "Próxima imagem" }).click();
    await expect(dialog.getByText(`Imagem 2 de ${imageCount}`, { exact: true })).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("página institucional publicada é servida pelo front", async ({ page }) => {
  const { page: institutionalPage } = getEditorialFixture();
  const response = await page.goto(institutionalPage.path);

  expect(response?.ok()).toBe(true);
  await expect(page.locator("main").getByText("Institucional", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(new RegExp(escapeRegExp(institutionalPage.title), "i"));
  await expect(page.locator(".article-body")).not.toBeEmpty();
});

test("menu mobile abre e fecha pelo teclado", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Cenário exclusivo do viewport mobile");
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeHidden();
});

test("feed e ads.txt refletem conteúdo e configuração atuais", async ({ request }) => {
  const fixture = getEditorialFixture();
  const feed = await request.get("/feed/");
  expect(feed.status()).toBe(200);
  expect(feed.headers()["content-type"]).toContain("application/rss+xml");
  const feedBody = await feed.text();
  expect(feedBody).toContain("<rss");
  expect(feedBody).toContain(fixture.story.path);

  const ads = await request.get("/ads.txt");
  const configuredClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  if (configuredClient && /^ca-pub-\d+$/.test(configuredClient)) {
    expect(ads.status()).toBe(200);
    expect(await ads.text()).toContain(`google.com, ${configuredClient.replace(/^ca-/, "")}, DIRECT`);
  } else {
    expect([200, 404]).toContain(ads.status());
    if (ads.status() === 200) expect(await ads.text()).toMatch(/^google\.com, pub-\d+, DIRECT,/);
  }
});

test("endpoints editoriais rejeitam chamadas sem segredo", async ({ request }) => {
  expect((await request.get("/api/draft/?id=1&secret=invalido")).status()).toBe(401);
  expect((await request.post("/api/revalidate/", { data: { slug: "teste" } })).status()).toBe(401);
});

test("SEO técnico referencia a matéria descoberta", async ({ request }) => {
  const { story } = getEditorialFixture();
  const home = await request.get("/");
  expect(home.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain(story.path);
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap:");
});

test("rotas inválidas não são indexáveis e aliases de matéria redirecionam", async ({ request }) => {
  const { story } = getEditorialFixture();
  const missing = await request.get("/rota-que-nao-existe-joysticknights-404/");
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toMatch(/<meta[^>]+name=["']robots["'][^>]+noindex/i);

  if (story.path !== `/${story.slug}/`) {
    const alias = await request.get(`/${story.slug}/`, { maxRedirects: 0 });
    expect(alias.status()).toBe(308);
    const locations = alias.headers().location?.split(",").map((location) => location.trim()) ?? [];
    expect(locations.length).toBeGreaterThan(0);
    expect(locations.every((location) => location === story.path)).toBe(true);
  }
});
