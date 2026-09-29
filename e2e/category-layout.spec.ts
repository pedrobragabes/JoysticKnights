import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem("editorial-site-consent", JSON.stringify({ version: 1, statistics: false, marketing: false, updatedAt: new Date().toISOString() })));
});

for (const category of ["noticias", "analises", "plataformas/playstation"]) {
  test(`${category}: matérias ocupam a primeira tela antes dos destaques secundários`, async ({ page, isMobile }) => {
    const viewports = isMobile
      ? [{ width: 390, height: 844, columns: 1 }]
      : [{ width: 1440, height: 900, columns: 3 }, { width: 2400, height: 1172, columns: 4 }];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      const response = await page.goto(`/category/${category}/`);
      expect(response?.status()).toBe(200);
      const archive = page.getByRole("region", { name: "Matérias", exact: true });
      const cards = archive.locator("article");
      await expect(cards.first()).toBeInViewport();
      // A sparse review group used to take the entire first screen. The first
      // visible articles must belong to the main, paginated category archive.
      await expect(page.locator("main article a").first()).toHaveAttribute("href", (await cards.first().locator("a").getAttribute("href"))!);
      const firstRow = await cards.evaluateAll((articles, columns) => articles.slice(0, columns).map((article) => {
        const { x, y, right, bottom } = article.getBoundingClientRect();
        return { x, y, right, bottom };
      }), viewport.columns);
      expect(firstRow).toHaveLength(viewport.columns);
      for (let index = 0; index < firstRow.length; index++) {
        const card = firstRow[index];
        expect(card.y).toBeLessThan(viewport.height * 0.45);
        expect(card.bottom).toBeLessThanOrEqual(viewport.height);
        expect(card.right).toBeLessThanOrEqual(viewport.width);
        expect(Math.abs(card.y - firstRow[0].y)).toBeLessThan(2);
        if (index > 0) expect(card.x).toBeGreaterThanOrEqual(firstRow[index - 1].right);
      }
      const headerLeft = await page.locator("main h1").evaluate((heading) => heading.getBoundingClientRect().left);
      expect(Math.abs(headerLeft - firstRow[0].x)).toBeLessThan(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect.poll(() => cards.first().locator(".story-image img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0), { timeout: 20_000 }).toBe(true);
    }
  });
}

test("notícias mantêm a navegação paginada após reorganizar os blocos", async ({ page }) => {
  await page.goto("/category/noticias/");
  const firstHref = await page.getByRole("region", { name: "Matérias", exact: true }).locator("article a").first().getAttribute("href");
  await page.getByRole("navigation", { name: "Paginação" }).getByRole("link", { name: "Próxima" }).click();
  await expect(page).toHaveURL(/\/category\/noticias\/page\/2\/$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/category\/noticias\/page\/2\/$/);
  await expect(page.getByRole("region", { name: "Matérias", exact: true }).locator("article a").first()).not.toHaveAttribute("href", firstHref!);
  await expect(page.getByRole("complementary", { name: "Mais para explorar" })).toHaveCount(0);
});
