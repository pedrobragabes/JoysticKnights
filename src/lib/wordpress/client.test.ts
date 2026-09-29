import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/site-config", () => ({ siteConfig: { defaultWordPressApiUrl: "https://cms.example.test/wp-json/wp/v2" } }));
import { wordPressRequest } from "./client";

afterEach(() => vi.unstubAllGlobals());
describe("WordPress availability", () => {
  it("retries connection failures without changing a static render to dynamic", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(new Response("[]"));
    vi.stubGlobal("fetch", fetcher);
    await expect(wordPressRequest("/posts")).resolves.toMatchObject({ data: [] });
    for (const [, options] of fetcher.mock.calls) {
      expect(options.cache).not.toBe("no-store");
      expect(options.next).toEqual({ revalidate: 300, tags: ["wordpress"] });
    }
    expect(fetcher.mock.calls[1][1].signal).not.toBe(fetcher.mock.calls[0][1].signal);
  });
  it("retries transient failures and preserves pagination totals", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("failure", { status: 503 }))
      .mockResolvedValueOnce(new Response("[]", { headers: { "x-wp-total": "30", "x-wp-totalpages": "3" } }));
    vi.stubGlobal("fetch", fetcher);
    await expect(wordPressRequest("/posts")).resolves.toMatchObject({ total: 30, totalPages: 3 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("preserves WordPress error codes to distinguish missing pages from service failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "rest_post_invalid_page_number" }), { status: 400 })));
    await expect(wordPressRequest("/posts", { page: 999 })).rejects.toMatchObject({ status: 400, code: "rest_post_invalid_page_number" });
  });
  it("keeps explicitly uncached draft requests uncached on every attempt", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("failure", { status: 503 }))
      .mockResolvedValueOnce(new Response("[]"));
    vi.stubGlobal("fetch", fetcher);
    await expect(wordPressRequest("/posts", {}, ["wordpress"], { cache: "no-store" })).resolves.toMatchObject({ data: [] });
    for (const [, options] of fetcher.mock.calls) {
      expect(options.cache).toBe("no-store");
      expect(options.next).toBeUndefined();
    }
  });
  it("does not disguise persistent upstream failures as empty results", async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response("failure", { status: 500 })));
    vi.stubGlobal("fetch", fetcher);
    await expect(wordPressRequest("/posts")).rejects.toMatchObject({ status: 500 });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
