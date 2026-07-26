import { describe, expect, it } from "vitest";
import { getHrefSegments, getLocalHref, mapAuthor, mapComment, mapPage, mapPost, mapSeo, mapTerm } from "./mappers";
import type { RawComment, RawPage, RawPost } from "./raw-types";

function rawPost(link: string): RawPost {
  return {
    id: 42,
    slug: "uma-grande-materia",
    link,
    date: "2026-07-20T12:00:00",
    modified: "2026-07-20T13:00:00",
    title: { rendered: "Uma grande matéria" },
    excerpt: { rendered: "<p>Resumo</p>" },
    content: { rendered: "<p>Conteúdo</p>" },
    author: 1,
    featured_media: 0,
    comment_status: "open",
    categories: [7],
    tags: [],
  };
}

describe("mapeamento de permalinks WordPress", () => {
  it("mantém posts de raiz e preserva posts com /%category%/%postname%/", () => {
    expect(mapPost(rawPost("https://promogamesbr.com/uma-grande-materia/"))).toMatchObject({
      href: "/uma-grande-materia/",
      commentStatus: "open",
    });
    expect(mapPost(rawPost("https://joysticknights.com.br/analises/uma-grande-materia/")).href).toBe("/analises/uma-grande-materia/");
  });

  it("preserva o caminho hierárquico de categorias legadas", () => {
    const category = mapTerm({
      id: 7,
      name: "PlayStation",
      slug: "playstation",
      link: "https://joysticknights.com.br/category/plataformas/playstation/",
      taxonomy: "category",
      parent: 3,
    });

    expect(category.href).toBe("/category/plataformas/playstation/");
    expect(getHrefSegments(category.href)).toEqual(["category", "plataformas", "playstation"]);
  });

  it("usa os links reais de autores e a rota legada de tags como fallback", () => {
    expect(mapAuthor({
      id: 5,
      name: "Redação",
      slug: "redacao",
      link: "https://joysticknights.com.br/author/redacao/",
    }).href).toBe("/author/redacao/");

    expect(mapTerm({
      id: 11,
      name: "RPG",
      slug: "rpg",
      taxonomy: "post_tag",
    }).href).toBe("/tag/rpg/");
  });

  it("descarta origem, busca e hash e usa fallback para links inválidos", () => {
    expect(getLocalHref("https://example.com/sobre/?ref=menu#equipe", "/fallback/")).toBe("/sobre/");
    expect(getLocalHref("http://[", "/fallback/")).toBe("/fallback/");
    expect(getLocalHref("javascript:alert(1)", "/fallback/")).toBe("/fallback/");
  });
});

describe("mapSeo", () => {
  it("normaliza os campos publicados pelo plugin core", () => {
    expect(mapSeo({
      title: "<strong>Título especial</strong>",
      description: "Descrição &amp; contexto",
      canonical: "/materia-especial/?origem=seo#trecho",
      social_image: "https://cdn.example.com/social.jpg#preview",
    })).toEqual({
      title: "Título especial",
      description: "Descrição & contexto",
      canonical: "/materia-especial/?origem=seo",
      socialImage: "https://cdn.example.com/social.jpg",
    });
  });

  it("ignora URLs inseguras e objetos vazios", () => {
    expect(mapSeo({ canonical: "javascript:alert(1)", social_image: "data:image/png;base64,x" })).toBeUndefined();
    expect(mapSeo()).toBeUndefined();
  });
});

describe("mapComment", () => {
  it("mapeia somente dados públicos e normaliza o nome exibido", () => {
    const comment: RawComment = {
      id: 21,
      post: 42,
      parent: 0,
      author_name: "<strong>Maria &amp; João</strong>",
      date: "2026-07-26T12:00:00",
      content: { rendered: "<p>Ótima matéria!</p>" },
      status: "approved",
      type: "comment",
    };

    expect(mapComment(comment)).toEqual({
      id: 21,
      postId: 42,
      parentId: 0,
      authorName: "Maria & João",
      publishedAt: "2026-07-26T12:00:00",
      content: "<p>Ótima matéria!</p>",
    });
  });
});

describe("mapPage", () => {
  it("mapeia uma página institucional retornada por wp/v2/pages", () => {
    const page: RawPage = {
      id: 9,
      slug: "sobre",
      link: "https://joysticknights.com.br/sobre/",
      date: "2026-07-01T10:00:00",
      modified: "2026-07-02T10:00:00",
      title: { rendered: "Sobre &amp; equipe" },
      excerpt: { rendered: "<p>Conheça o projeto.</p>" },
      content: { rendered: "<h2>Nossa história</h2><p>Texto</p>" },
      parent: 0,
      menu_order: 2,
      promogames_seo: {
        title: "Conheça a equipe",
        description: "Quem escreve no site.",
        canonical: "/sobre-o-projeto/",
        social_image: "https://cdn.example.com/sobre.jpg",
      },
    };

    expect(mapPage(page)).toMatchObject({
      id: 9,
      slug: "sobre",
      href: "/sobre/",
      title: "Sobre & equipe",
      excerpt: "Conheça o projeto.",
      parentId: 0,
      menuOrder: 2,
      seo: {
        title: "Conheça a equipe",
        description: "Quem escreve no site.",
        canonical: "/sobre-o-projeto/",
        socialImage: "https://cdn.example.com/sobre.jpg",
      },
    });
  });
});
