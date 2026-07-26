import type { Story } from "./types";
import { getCategoryHref, siteConfig } from "../site-config";

const author = {
  id: 0,
  name: siteConfig.newsroomLabel,
  slug: `redacao-${siteConfig.profile}`,
  href: `/autor/redacao-${siteConfig.profile}/`,
  description: "Notícias, análises e guias para quem vive videogames.",
};

const category = {
  id: 70,
  name: "Notícias",
  slug: "noticias",
  href: getCategoryHref("noticias"),
  taxonomy: "category",
};

const promoGamesTitles = [
  [6679, "novidades-de-julho-no-catalogo-playstation-plus-avatar-rise-of-the-ronin-e-incendios-reais-chegam-com-tudo", "Novidades de julho no Catálogo PlayStation Plus chegam com tudo"],
  [6643, "granblue-fantasy-relink-endless-ragnarok-review", "Granblue Fantasy Relink: Endless Ragnarok — Review"],
  [6659, "assassins-creed-black-flag-resynced-vende-o-dobro-de-shadows-no-lancamento-aponta-relatorio", "Assassin’s Creed Black Flag Resynced estreia em alta"],
  [6653, "playstation-plus-recebe-nove-novos-jogos-no-catalogo-em-julho", "PlayStation Plus recebe nove novos jogos no catálogo"],
] as const;

const joystickNightsTitles = [
  [900001, "modern-warfare-4-revela-datas-do-beta-e-cod-next-pre-venda-no-switch-2-comeca-em-agosto", "Modern Warfare 4 revela datas do Beta e COD: NEXT; pré-venda no Switch 2 começa em agosto", "noticias"],
  [900002, "blackcell-da-temporada-04-de-black-ops-7-e-warzone-vale-a-pena", "BlackCell da Temporada 04 de Black Ops 7 e Warzone: vale a pena?", "analises"],
  [900003, "blackcell-da-temporada-03-de-black-ops-7-e-warzone-vale-a-pena-review-completa", "BlackCell da Temporada 03 de Black Ops 7 e Warzone: review completa", "noticias"],
  [900004, "crimson-desert-recebe-trailer-de-lancamento-epico-focado-em-combates-e-mundo-aberto", "Crimson Desert recebe trailer de lançamento épico focado em combates e mundo aberto", "noticias"],
] as const;

const titles = siteConfig.profile === "joysticknights" ? joystickNightsTitles : promoGamesTitles;

export const fallbackStories: Story[] = titles.map(([id, slug, title, categorySlug], index) => ({
  id,
  slug,
  href: siteConfig.profile === "joysticknights" ? `/${categorySlug}/${slug}/` : `/${slug}/`,
  sourceUrl: `${siteConfig.defaultSiteUrl}${siteConfig.profile === "joysticknights" ? `/${categorySlug}/${slug}/` : `/${slug}/`}`,
  title,
  excerpt: "A redação está reconectando com o WordPress. Enquanto isso, este destaque mantém a experiência disponível.",
  content: `<p>Conteúdo temporariamente indisponível. Tente novamente em instantes.</p>`,
  publishedAt: new Date(Date.UTC(2026, 6, 15, 15 - index)).toISOString(),
  modifiedAt: new Date(Date.UTC(2026, 6, 15, 15 - index)).toISOString(),
  author,
  commentStatus: "closed",
  categories: [category],
  tags: [],
  primaryCategory: category,
  readingMinutes: 1,
  platforms: [],
  featured: index === 0,
}));
