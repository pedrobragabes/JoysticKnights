import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/site-config", () => ({ getSiteUrl: () => "https://beta.example.test", siteConfig: { defaultWordPressApiUrl: "https://cms.example.test/wp-json/wp/v2" } }));
const body = { authorName: "Pessoa Teste", authorEmail: "teste@example.com", subject: "Correção", content: "Mensagem válida.", privacy: true, idempotencyKey: randomUUID() };
function request(origin = "https://beta.example.test", payload = body) { return new Request("https://beta.example.test/api/contact/", { method: "POST", headers: { origin, "content-type": "application/json", "x-forwarded-for": "192.0.2.123" }, body: JSON.stringify(payload) }); }
beforeEach(() => { vi.stubEnv("WORDPRESS_API_URL", "https://cms.example.test/wp-json/wp/v2"); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });
describe("contact delivery boundary", () => {
  it("keeps contact on its configured CMS when editorial content uses staging", async () => {
    vi.stubEnv("WORDPRESS_CONTACT_SECRET", "test-only-secret");
    vi.stubEnv("WORDPRESS_API_URL", "https://staging.example.test/wp-json/wp/v2");
    vi.stubEnv("WORDPRESS_CONTACT_API_URL", "https://contact.example.test/wp-json/wp/v2");
    const upstream = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "received" }), { status: 201 }));
    vi.stubGlobal("fetch", upstream);
    const { POST } = await import("./route");
    expect((await POST(request())).status).toBe(201);
    expect(String(upstream.mock.calls[0][0])).toBe("https://contact.example.test/wp-json/promogames-contact/v1/messages");
  });
  it("uses only the dedicated server credential and requires a durable receipt", async () => {
    vi.stubEnv("WORDPRESS_CONTACT_SECRET", "test-only-secret");
    vi.stubEnv("WORDPRESS_CONTACT_API_URL", "");
    const upstream = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "received" }), { status: 201 }));
    vi.stubGlobal("fetch", upstream);
    const { POST } = await import("./route");
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(String(upstream.mock.calls[0][0])).toBe("https://cms.example.test/wp-json/promogames-contact/v1/messages");
    expect(JSON.parse(upstream.mock.calls[0][1].body)).toMatchObject({ privacy: true, idempotencyKey: body.idempotencyKey });
    expect(await response.text()).not.toContain("test-only-secret");
  });
  it("rejects cross-origin requests before contacting WordPress", async () => {
    vi.stubEnv("WORDPRESS_CONTACT_SECRET", "test-only-secret");
    const upstream = vi.fn(); vi.stubGlobal("fetch", upstream);
    const { POST } = await import("./route");
    expect((await POST(request("https://other.example.test"))).status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("does not claim receipt when the origin returns an HTML success page", async () => {
    vi.stubEnv("WORDPRESS_CONTACT_SECRET", "test-only-secret");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Unavailable</html>")));
    const { POST } = await import("./route");
    expect((await POST(request())).status).toBe(502);
  });
  it("requires consent and a retry identifier before sending", async () => {
    vi.stubEnv("WORDPRESS_CONTACT_SECRET", "test-only-secret");
    const upstream = vi.fn(); vi.stubGlobal("fetch", upstream);
    const { POST } = await import("./route");
    expect((await POST(request("https://beta.example.test", { ...body, privacy: false }))).status).toBe(400);
    expect((await POST(request("https://beta.example.test", { ...body, idempotencyKey: "invalid" }))).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
});
