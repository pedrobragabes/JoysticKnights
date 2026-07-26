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
  await expect(page.getByRole("searchbox")).toHaveValue(searchTerm);
  await expect(page.locator("main article").first()).toBeVisible();
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

test("matéria atual renderiza conteúdo, autoria, SEO e espaço de anúncio", async ({ page }) => {
  const { story } = getEditorialFixture();
  const response = await page.goto(story.path);

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(new RegExp(escapeRegExp(story.title), "i"));
  await expect(page.locator(".article-body")).not.toBeEmpty();
  await expect(page.getByText("Sobre o autor")).toBeVisible();
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain("NewsArticle");
  await expect(page.getByLabel("Publicidade").first()).toHaveCSS("min-height", "180px");

  const violations = await new AxeBuilder({ page }).analyze();
  expect(violations.violations.filter((item) => item.impact === "critical")).toEqual([]);
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
