import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem("editorial-site-consent", JSON.stringify({ version: 1, statistics: false, marketing: false, updatedAt: new Date().toISOString() })));
});

test("melhorias editoriais preservam a identidade e os destinos do JoystickNights", async ({ page, isMobile, request }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-profile", "joysticknights");
  await expect(page).toHaveTitle(/JoystickNights/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Notícias");
  await expect(page.locator('a[href*="chat.whatsapp.com"], a[href*="t.me/"], img[src*="promogames"], [data-promogames-area]')).toHaveCount(0);
  const heroImages = page.getByTestId("featured-carousel").locator("img");
  await expect(heroImages.first()).toHaveAttribute("fetchpriority", "high");
  await expect(heroImages.nth(1)).toHaveAttribute("loading", "lazy");
  if (isMobile) await page.getByRole("button", { name: "Abrir menu" }).click();
  const navigation = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(navigation.getByText("Conteúdo", { exact: true })).toBeVisible();
  await expect(navigation.getByText("Plataformas", { exact: true })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Início", exact: true })).toHaveAttribute("aria-current", "page");
  const playstation = navigation.getByRole("link", { name: "PlayStation", exact: true });
  await expect(playstation).toHaveAttribute("href", "/category/plataformas/playstation/");
  await expect(playstation.locator('[aria-hidden="true"]')).toHaveCSS("mask-image", /\/brands\/playstation\.svg/);
  await playstation.click();
  if (isMobile) await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(navigation.getByRole("link", { name: "PlayStation", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(navigation.getByRole("link", { name: "Início", exact: true })).not.toHaveAttribute("aria-current");
  for (const brand of ["playstation", "xbox", "nintendoswitch", "windows"]) {
    const asset = await request.get(`/brands/${brand}.svg`);
    expect(asset.ok()).toBe(true);
    expect(asset.headers()["content-type"]).toContain("image/svg+xml");
  }
});

test("menu inteiro permanece acessível em telas pequenas e na horizontal", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Regressão das dimensões do menu mobile.");
  for (const viewport of [{ width: 320, height: 568 }, { width: 667, height: 375 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    const navigation = page.getByRole("navigation", { name: "Navegação principal" });
    const contact = navigation.getByRole("link", { name: "Contato", exact: true });
    await contact.scrollIntoViewIfNeeded();
    await expect(contact).toBeInViewport();
    await contact.click();
    await expect(page).toHaveURL(/\/contato\/$/);
    await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("contato oferece o e-mail da redação e preserva privacidade e contraste", async ({ page }) => {
  await page.goto("/contato/");
  await expect(page.getByRole("link", { name: "Enviar e-mail para contact@joysticknights.com.br" })).toHaveAttribute("href", "mailto:contact@joysticknights.com.br");
  await expect(page.locator('form a[href="/politica-de-privacidade/"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar mensagem" })).toBeVisible();
  for (const theme of ["dark", "light"]) {
    if (theme === "light") {
      await page.getByRole("button", { name: "Ativar modo claro" }).click();
      await expect(page.locator("html")).not.toHaveClass(/theme-transitioning/);
    }
    const { violations } = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    expect(violations).toEqual([]);
  }
});
