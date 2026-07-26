import { describe, expect, it } from "vitest";
import { prepareArticleContent, sanitizeCommentHtml } from "./sanitize";

describe("prepareArticleContent", () => {
  it("remove scripts, preserva blocos editoriais e constrói sumário", () => {
    const result = prepareArticleContent('<script>alert(1)</script><h2>Primeira fase</h2><p>Texto</p><h3>Chefe final</h3><h2>Primeira fase</h2>');
    expect(result.html).not.toContain("script");
    expect(result.html).toContain('id="primeira-fase"');
    expect(result.html).toContain('id="primeira-fase-2"');
    expect(result.headings).toEqual([
      { id: "primeira-fase", label: "Primeira fase", level: 2 },
      { id: "chefe-final", label: "Chefe final", level: 3 },
      { id: "primeira-fase-2", label: "Primeira fase", level: 2 },
    ]);
  });

  it("protege links externos abertos em nova aba", () => {
    expect(prepareArticleContent('<a href="https://example.com" target="_blank">Fonte</a>').html).toContain('rel="noopener noreferrer"');
  });

  it("mantém links editoriais internos no front público", () => {
    const previousApiUrl = process.env.WORDPRESS_API_URL;
    process.env.WORDPRESS_API_URL = "https://cms.joysticknights.com.br/wp-json/wp/v2";
    const result = prepareArticleContent('<a href="https://cms.joysticknights.com.br/noticias/materia/?ref=antiga#trecho">Leia</a>');
    process.env.WORDPRESS_API_URL = previousApiUrl;

    expect(result.html).toContain('href="/noticias/materia/?ref=antiga#trecho"');
  });

  it("ativa imagens com lazy-load herdado do WordPress", () => {
    const result = prepareArticleContent(
      '<img src="data:image/svg+xml,%3Csvg/%3E" data-src="https://joysticknights.com.br/wp-content/uploads/capa.webp" data-srcset="https://joysticknights.com.br/wp-content/uploads/capa-400.webp 400w" alt="Capa">',
    );

    expect(result.html).toContain('src="https://joysticknights.com.br/wp-content/uploads/capa.webp"');
    expect(result.html).toContain('srcset="https://joysticknights.com.br/wp-content/uploads/capa-400.webp 400w"');
    expect(result.html).toContain('loading="lazy"');
  });
});

describe("sanitizeCommentHtml", () => {
  it("mantém formatação textual e remove mídia, scripts e atributos de apresentação", () => {
    const html = sanitizeCommentHtml('<p class="spam">Olá <strong>mundo</strong></p><script>alert(1)</script><img src="https://example.com/a.jpg"><iframe src="https://youtube.com/embed/x"></iframe>');
    expect(html).toContain("<strong>mundo</strong>");
    expect(html).not.toContain("class=");
    expect(html).not.toContain("script");
    expect(html).not.toContain("img");
    expect(html).not.toContain("iframe");
  });

  it("marca links de usuários como conteúdo não endossado", () => {
    const html = sanitizeCommentHtml('<a href="https://example.com" target="_blank">Fonte</a>');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="nofollow ugc noopener noreferrer"');
    expect(html).not.toContain("target=");
  });
});
