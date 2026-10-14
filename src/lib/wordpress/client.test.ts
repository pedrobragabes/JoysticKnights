import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const config = vi.hoisted(() => ({ profile: "joysticknights", defaultWordPressApiUrl: "https://cms.example.test/wp-json/wp/v2" }));
vi.mock("@/lib/site-config", () => ({ siteConfig: config }));
import { wordPressRequest } from "./client";

afterEach(() => { vi.unstubAllGlobals(); config.profile = "joysticknights"; });
describe("WordPress availability", () => {
  it("lets Next switch to dynamic rendering instead of retrying its control-flow exception", async () => {
    config.profile = "promogames";
    const dynamic = Object.assign(new Error("Dynamic server usage"), { digest: "DYNAMIC_SERVER_USAGE" });
    const fetcher = vi.fn().mockRejectedValue(dynamic);
    vi.stubGlobal("fetch", fetcher);
    await expect(wordPressRequest("/posts")).rejects.toBe(dynamic);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("reads PromoGames posts and pages fresh on every visit, including retries", async () => {
    config.profile = "promogames";
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError("network"))
      .mockImplementation(() => Promise.resolve(new Response("[]")));
    vi.stubGlobal("fetch", fetcher);
    await wordPressRequest("/posts");
    await wordPressRequest("/pages/123");
    for (const [, options] of fetcher.mock.calls) {
      expect(options.cache).toBe("no-store");
      expect(options.next).toBeUndefined();
    }
  });
  it("keeps taxonomy reads cached for PromoGames", async () => {
    config.profile = "promogames";
    const fetcher = vi.fn().mockResolvedValue(new Response("[]"));
    vi.stubGlobal("fetch", fetcher);
    await wordPressRequest("/categories");
    expect(fetcher.mock.calls[0][1].next).toEqual({ revalidate: 300, tags: ["wordpress"] });
  });
  it("preserves public cache policy and tags after a connection failure", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(new Response("[]"));
    vi.stubGlobal("fetch", fetcher);
    await expect(wordPressRequest("/posts")).resolves.toMatchObject({ data: [] });
    expect(fetcher.mock.calls[1][1].cache).toBeUndefined();
    expect(fetcher.mock.calls[1][1].next).toEqual({ revalidate: 300, tags: ["wordpress"] });
  });
  it("retries transient failures and preserves pagination totals", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("failure", { status: 503 }))
      .mockResolvedValueOnce(new Response("[]", { headers: { "x-wp-total": "30", "x-wp-totalpages": "3" } }));
    vi.stubGlobal("fetch", fetcher);
    await expect(wordPressRequest("/posts")).resolves.toMatchObject({ total: 30, totalPages: 3 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][1].next).toEqual(fetcher.mock.calls[0][1].next);
  });
  it("keeps private requests uncached after transient upstream failures", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("failure", { status: 503 }))
      .mockResolvedValueOnce(new Response("[]"));
    vi.stubGlobal("fetch", fetcher);
    await wordPressRequest("/posts/123", { context: "edit" }, [], { cache: "no-store" });
    for (const [, options] of fetcher.mock.calls) {
      expect(options.cache).toBe("no-store");
      expect(options.next).toBeUndefined();
    }
  });
  it("preserves WordPress error codes to distinguish missing pages from service failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "rest_post_invalid_page_number" }), { status: 400 })));
    await expect(wordPressRequest("/posts", { page: 999 })).rejects.toMatchObject({ status: 400, code: "rest_post_invalid_page_number" });
  });
  it("does not disguise persistent upstream failures as empty results", async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response("failure", { status: 500 })));
    vi.stubGlobal("fetch", fetcher);
    await expect(wordPressRequest("/posts")).rejects.toMatchObject({ status: 500 });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
