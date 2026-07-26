import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const storySlug = "/novidades-de-julho-no-catalogo-playstation-plus-avatar-rise-of-the-ronin-e-incendios-reais-chegam-com-tudo/";

test("home apresenta navegação e destaques editoriais", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "No controle agora" })).toBeVisible();
  await expect(page.locator("main").getByRole("link").filter({ has: page.locator("h2") })).toHaveCount(4);
  const violations = await new AxeBuilder({ page }).analyze();
  expect(violations.violations.filter((item) => item.impact === "critical")).toEqual([]);
});

test("busca mantém o termo e entrega resultados", async ({ page }) => {
  await page.goto("/buscar/?q=PlayStation");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Resultados para");
  await expect(page.getByRole("searchbox", { name: "Buscar no PromoGames" })).toHaveValue("PlayStation");
  await expect(page.locator("main article").first()).toBeVisible();
});

test("categoria e autor publicam seus arquivos", async ({ page }) => {
  await page.goto("/categoria/playstation/?page=2");
  await expect(page.getByRole("heading", { level: 1, name: "PlayStation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Paginação" }).getByText("2", { exact: true })).toHaveAttribute("aria-current", "page");

  await page.goto("/autor/igor-feanor-borges/");
  await expect(page.getByRole("heading", { level: 1, name: "Igor Feanor Borges" })).toBeVisible();
  await expect(page.locator("main article").first()).toBeVisible();
});

test("matéria real renderiza Gutenberg e autoria", async ({ page }) => {
  await page.goto(storySlug);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Catálogo PlayStation Plus");
  await expect(page.locator(".article-body")).toContainText("Avatar");
  await expect(page.getByText("Sobre o autor")).toBeVisible();
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain("NewsArticle");
  await expect(page.getByLabel("Publicidade")).toHaveCSS("min-height", "180px");
  const violations = await new AxeBuilder({ page }).analyze();
  expect(violations.violations.filter((item) => item.impact === "critical")).toEqual([]);
});

test("menu mobile abre e fecha pelo teclado", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Cenário exclusivo do viewport mobile");
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeHidden();
});

test("endpoints editoriais rejeitam chamadas sem segredo", async ({ request }) => {
  const draft = await request.get("/api/draft/?id=1&secret=invalido");
  expect(draft.status()).toBe(401);
  const revalidation = await request.post("/api/revalidate/", { data: { slug: "teste" } });
  expect(revalidation.status()).toBe(401);
  const authorized = await request.post("/api/revalidate/", {
    headers: { "x-promogames-secret": "e2e-revalidate-secret" },
    data: { slug: "teste", tags: ["stories", "tag-nao-permitida"], paths: ["/categoria/noticias/"] },
  });
  expect(authorized.status()).toBe(200);
  expect(await authorized.json()).toMatchObject({ revalidated: true });
});

test("SEO técnico publica sitemap e regras de crawler", async ({ request }) => {
  const home = await request.get("/");
  expect(home.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain(storySlug);
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /preview/");
});
