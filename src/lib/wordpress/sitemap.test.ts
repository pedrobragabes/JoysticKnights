import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("./client", () => ({ wordPressRequest: state.request, WordPressApiError: class extends Error {} }));
import { getCompleteSitemapStories, getCompleteSitemapPages, getCompleteSitemapTerms, getCompleteSitemapAuthors } from "./sitemap";
afterEach(() => vi.resetAllMocks());
const post = (id: number, media = 10) => ({ id, slug: `story-${id}`, link: `https://cms.example.test/story-${id}/`, modified: "2026-10-14T11:00:00", modified_gmt: "2026-10-14T14:00:00", featured_media: media });
const batch = (data: unknown[], total = data.length, totalPages = Math.ceil(total / 100)) => ({ data, total, totalPages });

describe("complete and lean sitemap reads", () => {
  it("preserves article URLs and modified times, batching shared images without embedded editorial fields", async () => {
    state.request.mockResolvedValueOnce(batch([post(1), post(2), post(3, 20)]))
      .mockResolvedValueOnce(batch([{ id: 10, source_url: "https://cms.example.test/full.jpg", media_details: { sizes: { large: { source_url: "https://cms.example.test/large.jpg" } } } }]));
    const stories = await getCompleteSitemapStories();
    expect(stories).toHaveLength(3);
    expect(stories[0]).toMatchObject({ href: "/story-1/", modifiedAt: "2026-10-14T14:00:00Z", image: { url: "https://cms.example.test/large.jpg" } });
    expect(stories[2]).toMatchObject({ href: "/story-3/", image: undefined });
    expect(state.request.mock.calls[0][1]).toEqual(expect.objectContaining({ status: "publish", orderby: "id", order: "asc", _fields: "id,slug,link,modified,modified_gmt,featured_media" }));
    expect(state.request.mock.calls[0][1]._embed).toBeUndefined();
    expect(state.request.mock.calls[1][1].include).toEqual([10, 20]);
    for (const call of state.request.mock.calls) expect(call[3]).toEqual({ cache: "no-store" });
  });
  it("does not truncate an inventory after 20 pages", async () => {
    state.request.mockImplementation(async (path, query) => {
      if (path === "/media") return batch([]);
      const first = (query.page - 1) * 100 + 1;
      return batch(Array.from({ length: query.page === 21 ? 1 : 100 }, (_, offset) => post(first + offset, 0)), 2001, 21);
    });
    const stories = await getCompleteSitemapStories();
    expect(stories).toHaveLength(2001);
    expect(stories.at(-1)?.href).toBe("/story-2001/");
    expect(state.request).toHaveBeenCalledTimes(21);
  });
  it("splits image reads into at most 100 unique IDs per request", async () => {
    state.request.mockImplementation(async (path, query) => path === "/media" ? batch([]) : batch(
      Array.from({ length: query.page === 1 ? 100 : 5 }, (_, offset) => post((query.page - 1) * 100 + offset + 1, (query.page - 1) * 100 + offset + 1)), 105, 2));
    expect(await getCompleteSitemapStories()).toHaveLength(105);
    const calls = state.request.mock.calls.filter(([path]) => path === "/media");
    expect(calls.map(([, query]) => query.include.length)).toEqual([100, 5]);
  });
  it("rejects duplicates or incomplete/invalid pagination instead of publishing a partial sitemap", async () => {
    state.request.mockResolvedValueOnce(batch([post(1), post(1)], 2, 1));
    await expect(getCompleteSitemapStories()).rejects.toThrow("incompleto");
    state.request.mockResolvedValueOnce(batch([post(1)], 2, 1));
    await expect(getCompleteSitemapStories()).rejects.toThrow("incompleto");
    state.request.mockResolvedValueOnce(batch([], 100000, 1000));
    await expect(getCompleteSitemapStories()).rejects.toThrow("divisão");
  });
  it("covers pages, all taxonomy pages and authors with lean public reads", async () => {
    state.request.mockResolvedValueOnce(batch([post(1, 0)]));
    expect((await getCompleteSitemapPages())[0].href).toBe("/story-1/");
    state.request.mockResolvedValueOnce(batch([{ id: 3, name: "PC", slug: "pc", link: "https://cms.example.test/tag/pc/", taxonomy: "post_tag" }]));
    expect((await getCompleteSitemapTerms("tags"))[0].href).toBe("/tag/pc/");
    state.request.mockResolvedValueOnce(batch([{ id: 9, name: "Autor", slug: "autor" }]));
    expect((await getCompleteSitemapAuthors())[0].name).toBe("Autor");
  });
  it("propagates service failures and accepts an empty CMS inventory", async () => {
    state.request.mockRejectedValueOnce(new Error("CMS indisponível"));
    await expect(getCompleteSitemapPages()).rejects.toThrow("CMS indisponível");
    state.request.mockResolvedValueOnce(batch([], 0, 0));
    expect(await getCompleteSitemapStories()).toEqual([]);
  });
});
