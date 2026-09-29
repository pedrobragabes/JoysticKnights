import Link from "next/link";
import { getStories } from "@/lib/wordpress/queries";
import { StoryListItem } from "./story-card";

export async function CategoryHighlights({ categoryId }: { categoryId: number }) {
  const groups = await Promise.all((["analise", "guia"] as const).map(async (type) => ({
    type, result: await getStories({ categoryId, editorialType: type, perPage: 3 }).catch(() => null),
  })));
  const availableGroups = groups.filter(({ result }) => result?.items.length);
  if (!availableGroups.length) return null;

  return <aside aria-label="Mais para explorar" className="border-t border-line bg-surface px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
    <div className="mx-auto max-w-[1460px] space-y-10">
      {availableGroups.map(({ type, result }) => <section key={type}>
        <h2 className="font-display text-2xl font-extrabold">{type === "analise" ? "Análises" : "Guias"}</h2>
        <div className="divide-y divide-line">{result!.items.map((story) => <StoryListItem key={story.id} story={story} />)}</div>
        <Link className="mt-3 inline-block font-bold text-brand" href={`/buscar/?category=${categoryId}&type=${type}`}>Ver {type === "analise" ? "todas as análises" : "todos os guias"} →</Link>
      </section>)}
    </div>
  </aside>;
}
