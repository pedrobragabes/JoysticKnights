import Link from "next/link";
import { getStories } from "@/lib/wordpress/queries";
import { StoryCard } from "./story-card";

export async function CategoryHighlights({ categoryId }: { categoryId: number }) {
  const groups = await Promise.all((["analise", "guia"] as const).map(async (type) => ({
    type, result: await getStories({ categoryId, editorialType: type, perPage: 3 }).catch(() => null),
  })));
  return <div className="mx-auto max-w-[1220px] px-4 pt-10 sm:px-6">{groups.map(({ type, result }) => result?.items.length ? <section key={type} className="mb-12">
    <h2 className="font-display mb-6 text-3xl font-extrabold">{type === "analise" ? "Análises" : "Guias"}</h2>
    <div className="grid gap-6 sm:grid-cols-3">{result.items.map((story) => <StoryCard key={story.id} story={story} />)}</div>
    <Link className="mt-5 inline-block font-bold text-brand" href={`/buscar/?category=${categoryId}&type=${type}`}>Ver {type === "analise" ? "todas as análises" : "todos os guias"} →</Link>
  </section> : null)}</div>;
}
