import { afterEach, describe, expect, it } from "vitest";
import { getPageMetadata, getStoryMetadata } from "./metadata";
import type { Story, WordPressPage } from "./types";

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
  it("prioriza o SEO customizado e converte canonical do CMS em caminho público", () => {
    process.env.WORDPRESS_API_URL = "https://cms.example.test/wp-json/wp/v2";

    expect(getStoryMetadata(story)).toMatchObject({
      title: { absolute: "Título para buscadores" },
      description: "Descrição para buscadores",
      authors: [{ name: "Ana", url: "/author/ana/" }],
      alternates: { canonical: "/canonical-da-materia/" },
      openGraph: {
        url: "/canonical-da-materia/",
        title: "Título para buscadores",
        description: "Descrição para buscadores",
        images: [{ url: "https://cdn.example.test/social.jpg", alt: "Título editorial" }],
      },
      twitter: {
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
        title: "Quem somos",
        images: ["https://cdn.example.test/sobre-social.jpg"],
      },
    });
  });
});
