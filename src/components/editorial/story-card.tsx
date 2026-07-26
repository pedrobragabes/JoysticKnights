import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { Story } from "@/lib/wordpress/types";
import { StoryImage } from "./story-image";

export function StoryCard({ story, priority = false }: { story: Story; priority?: boolean }) {
  return (
    <article>
      <Link href={story.href} className="story-link group block">
        <StoryImage image={story.image} alt={story.title} priority={priority} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="aspect-video rounded-card" />
        <div className="pt-4">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.1em] text-brand">
            {story.primaryCategory?.name ?? "Notícia"}
          </p>
          <h3 className="font-display mt-2 text-xl font-extrabold leading-[1.12] tracking-[-0.035em] transition group-hover:text-brand">
            {story.title}
          </h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{story.excerpt}</p>
          <p className="mt-3 text-[0.7rem] font-bold uppercase tracking-[0.06em] text-muted">
            {formatDate(story.publishedAt)} · {story.readingMinutes} min
          </p>
        </div>
      </Link>
    </article>
  );
}

export function StoryListItem({ story }: { story: Story }) {
  return (
    <article className="py-5">
      <Link href={story.href} className="story-link group grid grid-cols-[7rem_1fr] gap-4 sm:grid-cols-[11rem_1fr_auto] sm:items-center">
        <StoryImage image={story.image} alt={story.title} sizes="176px" className="aspect-[4/3] rounded-xl sm:aspect-video" />
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.1em] text-brand">{story.primaryCategory?.name ?? "Notícia"}</p>
          <h3 className="font-display mt-1 text-lg font-extrabold leading-tight tracking-[-0.03em] transition group-hover:text-brand sm:text-xl">
            {story.title}
          </h3>
        </div>
        <p className="col-start-2 text-[0.7rem] font-bold uppercase text-muted sm:col-auto">
          {formatDate(story.publishedAt)}
        </p>
      </Link>
    </article>
  );
}
