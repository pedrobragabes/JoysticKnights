import { describe, expect, it } from "vitest";
import { prepareArticleContent, sanitizeCommentHtml } from "./sanitize";
import { plainText } from "../wordpress/text";

describe("prepareArticleContent", () => {
  it("removes imported citation components without losing copy or real source links", () => {
    const copy = '<p>Primeiro &lt;Cite refs={[&#8220;turn505086search10&#8243;,&#8221;turn505086search12&#8221;]}/&gt; depois.</p><p>Segundo &lt;Cite refs={["turn1search0"]}/></p><p>Terceiro <Cite refs={["turn2search0"]}/> fim.</p><p>Fonte: <a href="https://example.com/fonte">Fonte real</a></p>';
    const result = prepareArticleContent(copy);
    expect(result.html).not.toMatch(/Cite refs|turn\d+search/);
    expect(result.html).toContain("depois.");
    expect(result.html).toContain("fim.");
    expect(result.html).toContain('href="https://example.com/fonte"');
    expect(plainText(copy)).not.toMatch(/Cite refs|turn\d+search/);
    expect(plainText('<p>Texto citeturn1search0 publicado.</p>')).toBe("Texto publicado.");
  });
  it("recovers the numeric Spectra rating without publishing legacy schema", () => {
    const { html } = prepareArticleContent('<script type="application/ld+json">{"@type":"Review","reviewRating":{"ratingValue":3.5,"bestRating":5}}</script>');
    expect(html).toContain("Nota: 3.5 / 5");
    expect(html).not.toContain("script");
  });
  it("preserves interactive editorial blocks while blocking executable markup", () => {
    const { html } = prepareArticleContent('<details open><summary>Requisitos</summary><p>PC</p></details><audio controls src="https://example.com/audio.mp3"></audio><iframe src="https://www.youtube.com/embed/abc" onload="alert(1)"></iframe><iframe src="https://evil.example/embed"></iframe>');
    expect(html).toContain("<details open>");
    expect(html).toContain("<summary>Requisitos</summary>");
    expect(html).toContain("<audio controls");
    expect(html).toContain("www.youtube-nocookie.com/embed/abc");
    expect(html).not.toContain("evil.example");
    expect(html).not.toContain("onload");
  });
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

  it("preserva a imagem editorial no corpo mesmo quando também é a capa", () => {
    const result = prepareArticleContent(
      '<figure><img src="https://joysticknights.com.br/wp-content/uploads/2026/07/capa-1024x576.webp" alt="Capa"><figcaption>Imagem de divulgação</figcaption></figure><p>Começo da matéria.</p>',
    );

    expect(result.html).toContain("<img");
    expect(result.html).toContain("Imagem de divulgação");
    expect(result.html).toContain("Começo da matéria.");
  });

  it("preserva imagens repetidas com legendas ou tamanhos diferentes", () => {
    const result = prepareArticleContent(
      '<figure><img src="https://joysticknights.com.br/wp-content/uploads/cena.jpg" alt="Cena"></figure><figure><img src="https://joysticknights.com.br/wp-content/uploads/cena-800x450.jpg" alt="Cena repetida"></figure>',
    );

    expect(result.html.match(/<img/g)).toHaveLength(2);
  });
  it("preserva âncoras legadas e evita colisões com IDs de outros blocos", () => {
    const result = prepareArticleContent('<h2>Introdução</h2><h2 id="introducao">Seção antiga</h2><div id="chefe">Bloco</div><h3>Chefe</h3><h2 id="introducao">Repetição</h2>');
    expect(result.headings.map((heading) => heading.id)).toEqual(["introducao-2", "introducao", "chefe-2", "repeticao"]);
    expect(result.html).toContain('<h2 id="introducao">Seção antiga</h2>');
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
