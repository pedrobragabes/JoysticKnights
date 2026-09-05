import { afterEach, describe, expect, it } from "vitest";
import { getAuthorMetadata, getCategoryMetadata, getPageMetadata, getStoryMetadata, getTagMetadata } from "./metadata";
import type { Story, WordPressAuthor, WordPressPage, WordPressTerm } from "./types";

const originalWordPressApiUrl = process.env.WORDPRESS_API_URL;

afterEach(() => {
  if (originalWordPressApiUrl === undefined) delete process.env.WORDPRESS_API_URL;
  else process.env.WORDPRESS_API_URL = originalWordPressApiUrl;
});

const story: Story = {
  id: 42,
  slug: "materia",
  href: "/noticias/materia/",
  sourceUrl: "https://cms.example.test/noticias/materia/",
  title: "Título editorial",
  excerpt: "Resumo editorial",
  content: "<p>Conteúdo</p>",
  deck: "Linha fina editorial",
  publishedAt: "2026-07-20T12:00:00Z",
  modifiedAt: "2026-07-21T12:00:00Z",
  author: {
    id: 3,
    name: "Ana",
    slug: "ana",
    href: "/author/ana/",
    description: "Autora",
  },
  image: {
    url: "https://cdn.example.test/editorial.jpg",
    width: 1200,
    height: 630,
    alt: "Imagem editorial",
  },
  seo: {
    title: "Título para buscadores",
    description: "Descrição para buscadores",
    canonical: "https://cms.example.test/canonical-da-materia/",
    socialImage: "https://cdn.example.test/social.jpg",
  },
  commentStatus: "open",
  categories: [{ id: 7, name: "Notícias", slug: "noticias", href: "/category/noticias/", taxonomy: "category" }],
  tags: [],
  readingMinutes: 4,
  platforms: [],
  featured: false,
};

describe("metadados WordPress", () => {
  it("prioriza o SEO customizado e rejeita canonical interno que aponta para outra rota", () => {
    process.env.WORDPRESS_API_URL = "https://cms.example.test/wp-json/wp/v2";

    expect(getStoryMetadata(story)).toMatchObject({
      title: { absolute: "Título para buscadores" },
      description: "Descrição para buscadores",
      authors: [{ name: "Ana", url: "/author/ana/" }],
      alternates: { canonical: "/noticias/materia/" },
      openGraph: {
        url: "/noticias/materia/",
        title: "Título para buscadores",
        description: "Descrição para buscadores",
        images: [{ url: "https://cdn.example.test/social.jpg", alt: "Título editorial" }],
      },
      twitter: {
        site: "@errinhopog",
        title: "Título para buscadores",
        description: "Descrição para buscadores",
        images: ["https://cdn.example.test/social.jpg"],
      },
    });
  });

  it("aplica title, description, canonical e imagem social customizados em páginas", () => {
    const page: WordPressPage = {
      id: 9,
      slug: "sobre",
      href: "/sobre/",
      sourceUrl: "https://cms.example.test/sobre/",
      title: "Sobre",
      excerpt: "Sobre o projeto",
      content: "<p>Conteúdo</p>",
      publishedAt: "2026-07-01T10:00:00Z",
      modifiedAt: "2026-07-02T10:00:00Z",
      parentId: 0,
      menuOrder: 0,
      seo: {
        title: "Quem somos",
        description: "Conheça nossa redação.",
        canonical: "https://example.com/versao-original/",
        socialImage: "https://cdn.example.test/sobre-social.jpg",
      },
    };

    expect(getPageMetadata(page)).toMatchObject({
      title: { absolute: "Quem somos" },
      description: "Conheça nossa redação.",
      alternates: { canonical: "https://example.com/versao-original/" },
      openGraph: {
        url: "https://example.com/versao-original/",
        title: "Quem somos",
        images: [{ url: "https://cdn.example.test/sobre-social.jpg", alt: "Sobre" }],
      },
      twitter: {
        site: "@errinhopog",
        title: "Quem somos",
        images: ["https://cdn.example.test/sobre-social.jpg"],
      },
    });
  });

  it("converte canonical do CMS somente quando o caminho corresponde ao href público", () => {
    process.env.WORDPRESS_API_URL = "https://cms.example.test/wp-json/wp/v2";

    const metadata = getStoryMetadata({
      ...story,
      seo: { ...story.seo, canonical: "https://cms.example.test/noticias/materia/?versao=canonica" },
    });

    expect(metadata.alternates).toEqual({ canonical: "/noticias/materia/?versao=canonica" });
  });

  it("usa a imagem social padrão em posts e páginas sem imagem configurada", () => {
    const storyMetadata = getStoryMetadata({ ...story, image: undefined, seo: undefined });
    expect(storyMetadata.openGraph).toMatchObject({
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Título editorial" }],
    });
    expect(storyMetadata.twitter).toMatchObject({
      site: "@errinhopog",
      images: ["/og.png"],
    });

    const page: WordPressPage = {
      id: 9,
      slug: "sobre",
      href: "/sobre/",
      sourceUrl: "https://cms.example.test/sobre/",
      title: "Sobre",
      excerpt: "Sobre o projeto",
      content: "<p>Conteúdo</p>",
      publishedAt: "2026-07-01T10:00:00Z",
      modifiedAt: "2026-07-02T10:00:00Z",
      parentId: 0,
      menuOrder: 0,
    };
    expect(getPageMetadata(page)).toMatchObject({
      openGraph: { images: [{ url: "/og.png", width: 1200, height: 630, alt: "Sobre" }] },
      twitter: { site: "@errinhopog", images: ["/og.png"] },
    });
  });

  it("gera OG, Twitter, canonical paginado e fallback social para categorias, tags e autores", () => {
    const category: WordPressTerm = {
      id: 7,
      name: "Notícias",
      slug: "noticias",
      href: "/category/noticias/",
      taxonomy: "category",
      description: "Últimas notícias.",
    };
    const tag: WordPressTerm = {
      id: 8,
      name: "RPG",
      slug: "rpg",
      href: "/tag/rpg/",
      taxonomy: "post_tag",
      description: "Jogos de RPG.",
    };
    const author: WordPressAuthor = {
      id: 3,
      name: "Ana",
      slug: "ana",
      href: "/author/ana/",
      description: "Autora",
    };

    const cases = [
      [getCategoryMetadata(category, 2), "Notícias — Página 2", "/category/noticias/page/2/", "website"],
      [getTagMetadata(tag, 2), "RPG — Página 2", "/tag/rpg/page/2/", "website"],
      [getAuthorMetadata(author, 2), "Ana — Página 2", "/author/ana/page/2/", "profile"],
    ] as const;

    for (const [metadata, title, canonical, type] of cases) {
      expect(metadata.alternates).toEqual({ canonical });
      expect(metadata.openGraph).toMatchObject({
        type,
        url: canonical,
        title,
        images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
      });
      expect(metadata.twitter).toMatchObject({
        card: "summary_large_image",
        site: "@errinhopog",
        title,
        images: ["/og.png"],
      });
    }

    expect(getAuthorMetadata(author, 2).openGraph).toMatchObject({ type: "profile", username: "ana" });
  });
});
