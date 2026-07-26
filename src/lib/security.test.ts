import { describe, expect, it } from "vitest";
import { safeSecretEqual } from "./security";

describe("safeSecretEqual", () => {
  it("aceita somente segredos idênticos e configurados", () => {
    expect(safeSecretEqual("segredo-123", "segredo-123")).toBe(true);
    expect(safeSecretEqual("segredo-124", "segredo-123")).toBe(false);
    expect(safeSecretEqual("curto", "muito-maior")).toBe(false);
    expect(safeSecretEqual(null, "segredo")).toBe(false);
  });
});
