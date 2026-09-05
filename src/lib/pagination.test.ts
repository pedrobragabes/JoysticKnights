import { describe, expect, it } from "vitest";
import { getPaginationHref, parsePage } from "./pagination";

describe("parsePage", () => {
  it.each([[undefined, 1], ["", 1], ["-2", 1], ["abc", 1], ["3", 3], [["4", "5"], 4]])("converte %j para %i", (input, expected) => {
    expect(parsePage(input as string | string[] | undefined)).toBe(expected);
  });
});

describe("getPaginationHref", () => {
  it("uses canonical paths for archives and returns to their first page", () => {
    expect(getPaginationHref(2, undefined, "/category/noticias/")).toBe("/category/noticias/page/2/");
    expect(getPaginationHref(1, undefined, "/category/noticias/")).toBe("/category/noticias/");
    expect(getPaginationHref(3, undefined, "/")).toBe("/page/3/");
  });
  it("remove page=1 para não criar uma URL duplicada", () => {
    expect(getPaginationHref(1)).toBe("./");
    expect(getPaginationHref(1, { q: "GTA VI" })).toBe("?q=GTA+VI");
  });

  it("preserva filtros nas páginas seguintes", () => {
    expect(getPaginationHref(3, { q: "GTA VI" })).toBe("?q=GTA+VI&page=3");
  });
});
