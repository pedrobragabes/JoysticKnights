import { describe, expect, it } from "vitest";
import { parsePage } from "./pagination";

describe("parsePage", () => {
  it.each([[undefined, 1], ["", 1], ["-2", 1], ["abc", 1], ["3", 3], [["4", "5"], 4]])("converte %j para %i", (input, expected) => {
    expect(parsePage(input as string | string[] | undefined)).toBe(expected);
  });
});
