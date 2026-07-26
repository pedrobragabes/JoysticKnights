import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { Story } from "@/lib/wordpress/types";
import { StoryImage } from "./story-image";

export function HeroDeck({ stories }: { stories: Story[] }) {
  return (
    <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0 xl:grid-cols-[1.14fr_1fr_1fr_1fr]">
      {stories.map((story, index) => (
        <Link
          key={story.id}
          href={story.href}
          className="story-link group relative min-h-[430px] min-w-[78vw] snap-center overflow-hidden rounded-card bg-[#151219] text-white sm:min-w-[45vw] lg:min-w-0"
        >
          <StoryImage
            image={story.image}
            alt={story.title}
            priority={index === 0}
            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 25vw"
            className="absolute inset-0 h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.09em]">
              <span className="rounded-full bg-accent px-2.5 py-1">{story.primaryCategory?.name ?? "Destaque"}</span>
              <span className="text-white/70">{formatDate(story.publishedAt)}</span>
            </div>
            <h2 className={`font-display line-clamp-4 font-extrabold leading-[1.04] tracking-[-0.045em] ${index === 0 ? "text-[1.55rem] sm:text-[1.7rem]" : "text-[1.35rem]"}`}>
              {story.title}
            </h2>
          </div>
        </Link>
      ))}
    </div>
  );
}
