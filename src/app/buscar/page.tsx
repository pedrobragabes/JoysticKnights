import type { Metadata } from "next";
import { ArchiveHeader, StoryArchive } from "@/components/editorial/archive";
import { parsePage } from "@/lib/pagination";
import { siteConfig } from "@/lib/site-config";
import { getStories } from "@/lib/wordpress/queries";

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
  const result = search ? await getStories({ search, page, perPage: 12 }) : { items: [], page: 1, perPage: 12, total: 0, totalPages: 0 };

  return (
    <>
      <ArchiveHeader eyebrow="Busca" title={search ? `Resultados para “${search}”` : "Encontre sua próxima história"} description={search ? `${result.total} resultado${result.total === 1 ? "" : "s"} encontrado${result.total === 1 ? "" : "s"}.` : `Busque por jogos, plataformas, análises, guias ou qualquer assunto publicado no ${siteConfig.name}.`} />
      <section className="border-b border-line bg-surface px-4 pb-10 sm:px-6 lg:px-10">
        <form action="/buscar/" role="search" className="mx-auto flex max-w-3xl gap-2">
          <label htmlFor="busca" className="sr-only">Buscar no {siteConfig.name}</label>
          <input id="busca" name="q" type="search" defaultValue={search} autoFocus={!search} placeholder="Ex.: PlayStation Plus" className="min-h-12 min-w-0 flex-1 rounded-full border border-line bg-canvas px-5 text-ink outline-none transition focus:border-brand" />
          <button className="min-h-12 rounded-full bg-brand px-6 text-sm font-black text-white transition hover:bg-brand-strong">Buscar</button>
        </form>
      </section>
      <StoryArchive result={result} emptyMessage={search ? `Nenhum resultado para “${search}”.` : "Digite um termo para começar."} query={search ? { q: search } : undefined} />
    </>
  );
}
