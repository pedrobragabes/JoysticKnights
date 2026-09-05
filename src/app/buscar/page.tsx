import type { Metadata } from "next";
import { SearchInput } from "@/components/editorial/search-input";
import { ArchiveHeader, StoryArchive } from "@/components/editorial/archive";
import { Icon } from "@/components/icons";
import { parsePage } from "@/lib/pagination";
import { siteConfig } from "@/lib/site-config";
import { getCategories, getStories } from "@/lib/wordpress/queries";
import type { Paginated, Story } from "@/lib/wordpress/types";

export async function generateMetadata({ searchParams }: PageProps<"/buscar">): Promise<Metadata> {
  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  return {
    title: search ? `Busca: ${search}` : "Busca",
    description: `Encontre notícias, análises e guias no ${siteConfig.name}.`,
    alternates: { canonical: "/buscar/" },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps<"/buscar">) {
  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  const page = parsePage(query.page);
  const platforms = { playstation: "PlayStation", xbox: "Xbox", nintendo: "Nintendo", pc: "PC" };
  const platform = typeof query.platform === "string" && Object.hasOwn(platforms, query.platform) ? query.platform : "";
  const categories = await getCategories().catch(() => []);
  const category = categories.find((item) => String(item.id) === query.category);
  const editorialType = typeof query.type === "string" && ["noticia", "analise", "guia", "promocao"].includes(query.type) ? query.type : "";
  const canSearch = search.length >= 2 || (!search && Boolean(platform || category || editorialType));
  let unavailable = false;
  let result: Paginated<Story> = { items: [], page, perPage: 12, total: 0, totalPages: 0 };
  if (canSearch) {
    try { result = await getStories({ search, platform, editorialType, categoryId: category?.id, page, perPage: 12 }); }
    catch { unavailable = true; }
  }
  const emptyMessage = unavailable ? "A busca está temporariamente indisponível. Tente novamente em instantes." : !search && !canSearch
    ? "Digite um termo para começar."
    : !canSearch
      ? "Digite pelo menos 2 caracteres para pesquisar."
      : `Nenhum resultado para “${search}”.`;

  return (
    <>
      <ArchiveHeader eyebrow="Busca" title={search ? `Resultados para “${search}”` : "Encontre sua próxima história"} description={unavailable ? "Não foi possível consultar o acervo agora." : canSearch ? `${result.total} resultado${result.total === 1 ? "" : "s"} encontrado${result.total === 1 ? "" : "s"}.` : `Busque por jogos, plataformas, análises, guias ou qualquer assunto publicado no ${siteConfig.name}.`} />
      <section className="border-b border-line bg-surface px-4 pb-10 sm:px-6 lg:px-10">
        <form action="/buscar/" role="search" className="mx-auto max-w-3xl">
          <label htmlFor="busca" className="sr-only">Buscar no {siteConfig.name}</label>
          <div className="flex min-h-14 items-center rounded-full border border-line bg-canvas p-1.5 pl-5 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
            <Icon name="search" className="size-5 shrink-0 text-muted" />
            <SearchInput initialValue={search} />
            <button className="min-h-11 rounded-full bg-brand px-5 text-sm font-black text-white transition hover:bg-brand-strong sm:px-7">Buscar</button>
          </div>
          <p className="mt-3 px-4 text-sm text-muted">Use de 2 a 100 caracteres. Você pode buscar por jogo, plataforma ou assunto.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-bold">Tipo<select aria-label="Tipo" name="type" defaultValue={editorialType} className="mt-2 block min-h-11 w-full rounded-xl border border-line bg-canvas px-3"><option value="">Todos os tipos</option><option value="noticia">Notícias</option><option value="analise">Análises</option><option value="guia">Guias</option><option value="promocao">Promoções</option></select></label>
            <label className="text-sm font-bold">Plataforma<select aria-label="Plataforma" name="platform" defaultValue={platform} className="mt-2 block min-h-11 w-full rounded-xl border border-line bg-canvas px-3"><option value="">Todas as plataformas</option>{Object.entries(platforms).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-sm font-bold">Categoria<select aria-label="Categoria" name="category" defaultValue={category?.id ?? ""} className="mt-2 block min-h-11 w-full rounded-xl border border-line bg-canvas px-3"><option value="">Todas as categorias</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          </div>
        </form>
      </section>
      <StoryArchive compact result={result} emptyMessage={emptyMessage} query={canSearch ? { ...(editorialType ? { type: editorialType } : {}), ...(search ? { q: search } : {}), ...(platform ? { platform } : {}), ...(category ? { category: String(category.id) } : {}) } : undefined} />
    </>
  );
}
