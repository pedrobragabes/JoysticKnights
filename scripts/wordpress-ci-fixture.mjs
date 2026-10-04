// Read-only synthetic WordPress REST subset for CI. Never imported by the app.
import { createServer } from "node:http";

const source = "https://cms.joysticknights.com.br";
const categories = [
  { id: 1, name: "Notícias", slug: "noticias", parent: 0 },
  { id: 2, name: "Análises", slug: "analises", parent: 0 },
  { id: 3, name: "Plataformas", slug: "plataformas", parent: 0 },
  { id: 4, name: "PlayStation", slug: "playstation", parent: 3 },
  { id: 5, name: "PC", slug: "pc", parent: 3 },
].map((term) => ({ ...term, taxonomy: "category", description: "Acervo sintético de teste.", link: `${source}/category/${term.parent ? "plataformas/" : ""}${term.slug}/` }));
const author = { id: 1, name: "Redação de teste", slug: "redacao-teste", link: `${source}/autor/redacao-teste/`, description: "Autor sintético exclusivo dos testes automatizados." };
const content = "<p>Esta publicação sintética verifica o frontend editorial sem depender de dados ou disponibilidade do CMS de produção. Nenhuma informação deste acervo representa uma notícia publicada.</p><h2>Conteúdo de teste</h2><p>Paginação, busca, arquivos, acessibilidade e metadados são exercitados com este conteúdo controlado.</p><img src='/joysticknights-logo.webp' alt='Marca JoystickNights de teste' width='480' height='160'><img src='/joysticknights-icon.png' alt='Ícone JoystickNights de teste' width='256' height='256'>";
const posts = Array.from({ length: 56 }, (_, index) => {
  const review = index % 2 === 1;
  const slug = index === 0 ? "demo-de-yakuza-kiwami-3-ja-disponivel" : index === 1 ? "review-assassins-creed-shadows-entre-o-stealth-e-a-mesmice" : `publicacao-sintetica-${index + 1}`;
  const terms = categories.filter((term) => [review ? 2 : 1, 4, 5].includes(term.id));
  const date = new Date(Date.UTC(2026, 9, 1) - index * 3_600_000).toISOString().replace(/Z$/, "");
  return {
    id: index + 1, slug, link: `${source}/${review ? "analises" : "noticias"}/${slug}/`,
    date, date_gmt: date, modified: date, modified_gmt: date,
    title: { rendered: `Publicação sintética ${index + 1} — Modern Adventure` },
    excerpt: { rendered: "<p>Conteúdo sintético para validação automatizada.</p>" },
    content: { rendered: content }, author: 1, featured_media: 1, comment_status: "closed",
    categories: terms.map((term) => term.id), tags: [],
    meta: { promogames_editorial_type: review ? "analise" : "noticia", promogames_platforms: ["playstation", "pc"], ...(review ? { promogames_review_score: 8, promogames_review_verdict: "Veredito sintético de teste." } : {}) },
    _embedded: { author: [author], "wp:term": [terms], "wp:featuredmedia": [{ source_url: "/brands/playstation.svg", alt_text: "Imagem editorial de teste", media_details: { width: 1200, height: 630 } }] },
  };
});
categories.forEach((term) => { term.count = posts.filter((post) => post.categories.includes(term.id)).length; });
const pages = [{ id: 100, slug: "sobre-teste", link: `${source}/sobre-teste/`, title: { rendered: "Sobre o acervo de teste" }, content: { rendered: content }, excerpt: { rendered: "Acervo institucional sintético." }, date: posts[0].date, modified: posts[0].modified, parent: 0, menu_order: 0 }];

createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  const send = (status, payload, headers = {}) => { response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers }); response.end(JSON.stringify(payload)); };
  if (request.method !== "GET") return send(405, { code: "fixture_read_only" });
  if (url.pathname === "/health") return send(200, { fixture: "synthetic", posts: posts.length });
  if (url.pathname === "/wp-json/promogames/v1/capabilities") return send(200, { editorial_filters: true });
  if (url.pathname === "/wp-json/promogames/v1/home") return send(200, { items: posts.slice(0, 4).map(({ id }) => ({ id })) });
  const collection = url.pathname.replace(/^\/wp-json\/wp\/v2\//, "").replace(/\/$/, "");
  let items = ({ posts, categories, tags: [], users: [author], pages, comments: [] })[collection];
  if (!items) return send(404, { code: "rest_no_route" });
  const query = url.searchParams;
  const ids = (key) => query.get(key)?.split(",").map(Number);
  if (query.has("slug")) items = items.filter((item) => item.slug === query.get("slug"));
  if (query.has("include")) items = items.filter((item) => ids("include").includes(item.id));
  if (query.has("exclude")) items = items.filter((item) => !ids("exclude").includes(item.id));
  if (query.has("search")) items = items.filter((item) => `${item.title?.rendered ?? item.name} ${item.content?.rendered ?? ""}`.toLowerCase().includes(query.get("search").toLowerCase()));
  if (collection === "posts") {
    if (query.has("categories")) items = items.filter((item) => ids("categories").some((id) => item.categories.includes(id)));
    if (query.has("tags")) items = items.filter((item) => ids("tags").some((id) => item.tags.includes(id)));
    if (query.has("author")) items = items.filter((item) => item.author === Number(query.get("author")));
    if (query.has("platform")) items = items.filter((item) => item.meta.promogames_platforms.includes(query.get("platform")));
    if (query.has("editorial_type")) items = items.filter((item) => item.meta.promogames_editorial_type === query.get("editorial_type"));
    if (query.has("before")) items = items.filter((item) => item.date < query.get("before"));
    if (query.has("after")) items = items.filter((item) => item.date > query.get("after"));
    if (query.get("order") === "asc") items = [...items].reverse();
  }
  if (query.get("hide_empty") === "true") items = items.filter((item) => item.count > 0);
  const perPage = Math.max(1, Math.min(100, Number(query.get("per_page") || 10)));
  const page = Math.max(1, Number(query.get("page") || 1));
  const totalPages = Math.ceil(items.length / perPage);
  if (page > 1 && page > totalPages) return send(400, { code: "rest_post_invalid_page_number" });
  send(200, items.slice((page - 1) * perPage, page * perPage), { "X-WP-Total": String(items.length), "X-WP-TotalPages": String(totalPages) });
}).listen(3199, "127.0.0.1", () => console.log("Synthetic read-only WordPress fixture: http://127.0.0.1:3199"));
