import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { StoryArticle } from "@/components/editorial/story-article";
import { getPreviewStoryById } from "@/lib/wordpress/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview editorial", robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: PageProps<"/preview/[id]">) {
  const [{ id }, draft] = await Promise.all([params, draftMode()]);
  if (!draft.isEnabled) notFound();
  const story = await getPreviewStoryById(Number.parseInt(id, 10));
  if (!story) notFound();

  return (
    <>
      <aside role="status" className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 bg-deals px-4 py-3 text-sm font-bold text-ink sm:px-6 lg:px-10">
        <span>Preview editorial — este conteúdo ainda não está publicado.</span>
        <form action="/api/draft/exit/" method="post"><button className="rounded-full bg-[#151219] px-4 py-2 text-xs font-black text-white">Sair do preview</button></form>
      </aside>
      <StoryArticle story={story} preview />
    </>
  );
}
