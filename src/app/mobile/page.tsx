import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArchiveHeader, StoryArchive } from "@/components/editorial/archive";
import { parsePage } from "@/lib/pagination";
import { getStories } from "@/lib/wordpress/queries";

export async function generateMetadata({ searchParams }: PageProps<"/mobile">): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  return { title: page > 1 ? `Mobile — Página ${page}` : "Mobile",
    description: "Notícias, análises e guias de jogos para Android e iOS.",
    alternates: { canonical: page > 1 ? `/mobile/?page=${page}` : "/mobile/" } };
}

export default async function MobilePage({ searchParams }: PageProps<"/mobile">) {
  const page = parsePage((await searchParams).page);
  const result = await getStories({ platform: "mobile", page, perPage: 12 });
  if (page > 1 && page > result.totalPages) notFound();
  return <><ArchiveHeader eyebrow="Plataformas" title="Mobile" description="Notícias, análises e guias de jogos para Android e iOS." count={result.total} />
    <StoryArchive result={result} emptyMessage="As matérias marcadas como Mobile no CMS aparecerão aqui." /></>;
}
