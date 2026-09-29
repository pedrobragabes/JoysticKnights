import { expect, it } from "vitest";
import { createContactMailto } from "./contact-mailto";

it("encodes Portuguese text, newlines and query characters without injecting mail headers", () => {
  const data = { name: "João Silva", email: "joao@example.com", subject: "Correção & parceria? #1", content: "Olá!\nSugestão: https://example.com/?a=1&b=2&bcc=intruso@example.com" };
  const uri = new URL(createContactMailto("contato@promogamesbr.com", data));
  expect(uri.protocol).toBe("mailto:");
  expect(uri.pathname).toBe("contato@promogamesbr.com");
  expect(uri.searchParams.get("subject")).toBe(data.subject);
  expect(uri.searchParams.get("body")).toContain(data.content);
  expect(uri.searchParams.get("body")).toContain(data.email);
  expect(uri.searchParams.has("bcc")).toBe(false);
});
