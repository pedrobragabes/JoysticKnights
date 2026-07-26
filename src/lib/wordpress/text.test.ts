import { describe, expect, it } from "vitest";
import { decodeHtmlEntities, plainText, readingTime, slugifyHeading, truncateText } from "./text";

describe("WordPress text helpers", () => {
  it("normaliza HTML e entidades", () => {
    expect(plainText("<p>PlayStation &amp; Xbox</p><script>perigo()</script>")).toBe("PlayStation & Xbox");
    expect(decodeHtmlEntities("Promo&#71;ames")).toBe("PromoGames");
  });

  it("cria resumos sem cortar palavras", () => {
    expect(truncateText("uma notícia muito importante para jogadores", 24)).toBe("uma notícia muito…");
    expect(truncateText("curto", 24)).toBe("curto");
  });

  it("gera IDs estáveis e tempo mínimo de leitura", () => {
    expect(slugifyHeading("Catálogo de Jogos: Julho!")).toBe("catalogo-de-jogos-julho");
    expect(readingTime("texto curto")).toBe(1);
  });
});
