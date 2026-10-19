import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ cookie: "" }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: () => ({ value: state.cookie }) })) }));
import { exchangePreviewCode, getScopedPreviewStory, parsePreviewScope, signPreviewScope, validPreviewScope } from "./preview";
beforeEach(() => { vi.stubEnv("DRAFT_MODE_SECRET", "local-preview-test-secret-only-32-characters"); vi.stubEnv("WORDPRESS_API_URL", "https://cms.example.test/wp-json/wp/v2"); state.cookie = ""; });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const scope = () => ({ postId: 7, ticket: "a".repeat(64), expiresAt: Math.floor(Date.now() / 1000) + 600 });
describe("scoped editorial preview", () => {
  it("signs only a limited, expiring single-post scope", () => {
    const original = scope(); const signed = signPreviewScope(original)!;
    expect(parsePreviewScope(signed)).toEqual(original);
    expect(parsePreviewScope(signed.replace(/.$/, signed.endsWith("a") ? "b" : "a"))).toBeNull();
    expect(validPreviewScope({ ...original, expiresAt: Math.floor(Date.now() / 1000) - 1 })).toBe(false);
    expect(validPreviewScope({ ...original, expiresAt: Math.floor(Date.now() / 1000) + 10000 })).toBe(false);
    expect(validPreviewScope({ ...original, postId: -1 })).toBe(false);
  });
  it("cannot enumerate another draft using the global Draft Mode cookie", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    state.cookie = signPreviewScope(scope())!;
    expect(await getScopedPreviewStory(8)).toBeNull();
    state.cookie = "tampered";
    expect(await getScopedPreviewStory(7)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("exchanges a one-time code using a server-only header, never a secret in the URL", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(scope()))); vi.stubGlobal("fetch", fetcher);
    expect(await exchangePreviewCode("b".repeat(64))).toMatchObject({ postId: 7 });
    expect(String(fetcher.mock.calls[0][0])).toBe("https://cms.example.test/wp-json/promogames/v1/preview/exchange");
    expect(fetcher.mock.calls[0][1]).toMatchObject({ method: "POST", cache: "no-store", redirect: "error" });
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(await exchangePreviewCode("invalid")).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("disables preview safely when not configured or when the CMS rejects the session", async () => {
    vi.stubEnv("DRAFT_MODE_SECRET", ""); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect(await exchangePreviewCode("a".repeat(64))).toBeNull(); expect(fetcher).not.toHaveBeenCalled();
    vi.stubEnv("DRAFT_MODE_SECRET", "local-preview-test-secret-only-32-characters");
    fetcher.mockResolvedValue(new Response("revoked", { status: 401 }));
    expect(await exchangePreviewCode("a".repeat(64))).toBeNull();
  });
});
