import { afterEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ set: vi.fn(), enable: vi.fn(), exchange: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: state.set }), draftMode: async () => ({ enable: state.enable }) }));
vi.mock("@/lib/wordpress/preview", () => ({ previewCookie: "scoped-cookie", exchangePreviewCode: state.exchange, signPreviewScope: () => "signed-test-scope" }));
vi.mock("@/lib/site-config", () => ({ getSiteUrl: () => "https://promogames.example.test" }));
import { GET } from "./route";
afterEach(() => vi.clearAllMocks());
it("uses the public HTTPS origin for cookies and redirects behind a reverse proxy", async () => {
  state.exchange.mockResolvedValue({ postId: 7, ticket: "a".repeat(64), expiresAt: Math.floor(Date.now() / 1000) + 600 });
  const response = await GET(new Request("http://localhost:3000/api/draft/?code=test"));
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("https://promogames.example.test/preview/7/");
  expect(state.set).toHaveBeenCalledWith("scoped-cookie", "signed-test-scope", expect.objectContaining({ secure: true, httpOnly: true, path: "/" }));
  expect(state.enable).toHaveBeenCalledOnce();
});
it("does not set a cookie or enable Draft Mode on rejected codes", async () => {
  state.exchange.mockResolvedValue(null);
  expect((await GET(new Request("https://promogames.example.test/api/draft/?secret=legacy&id=7"))).status).toBe(401);
  expect(state.enable).not.toHaveBeenCalled(); expect(state.set).not.toHaveBeenCalled();
});
