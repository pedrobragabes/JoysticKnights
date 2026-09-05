import { expect, test } from "@playwright/test";

test("contact form preserves input on failure and confirms successful receipt", async ({ page }) => {
  await page.goto("/contato/");
  const reject = page.getByRole("button", { name: "Recusar opcionais", exact: true });
  if (await reject.isVisible()) await reject.click();
  await page.getByLabel("Nome", { exact: true }).fill("Teste editorial");
  await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com");
  await page.getByLabel("Assunto", { exact: true }).fill("Correção de matéria");
  await page.getByLabel("Mensagem", { exact: true }).fill("Texto de teste do formulário.");
  await page.getByRole("checkbox").check();
  await page.route("**/api/contact/", route => route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ error: "Falha temporária" }) }));
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(page.getByRole("status")).toContainText("Falha temporária");
  await expect(page.getByLabel("Mensagem", { exact: true })).toHaveValue("Texto de teste do formulário.");
  await page.unroute("**/api/contact/");
  await page.route("**/api/contact/", route => route.fulfill({ status: 201, contentType: "application/json", body: '{"status":"received"}' }));
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(page.getByRole("status")).toContainText("Mensagem recebida");
  await expect(page.getByLabel("Mensagem", { exact: true })).toHaveValue("");
});

test("contact endpoint rejects requests from other origins", async ({ request }) => {
  const response = await request.post("/api/contact/", { headers: { Origin: "https://other.example" }, data: { content: "test" } });
  expect(response.status()).toBe(403);
});
