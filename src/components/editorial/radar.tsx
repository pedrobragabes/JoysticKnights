import Link from "next/link";
import type { Story } from "@/lib/wordpress/types";

export function Radar({ stories, plain = false }: { stories: Story[]; plain?: boolean }) {
  return (
    <div className="border-b border-line bg-surface px-4 sm:px-6 lg:px-10">
      <div className="scrollbar-none mx-auto flex min-h-12 max-w-[1460px] items-center gap-4 overflow-x-auto text-xs">
        <span className={plain ? "shrink-0 border-r border-line pr-4 font-bold text-ink" : "sticky left-0 shrink-0 rounded-full bg-brand px-3 py-1.5 font-black uppercase tracking-[0.11em] text-white"}>
          {plain ? "Últimas" : "Agora"}
        </span>
        <div className="flex min-w-max items-center gap-5 pr-4">
          {stories.map((story) => (
            <Link key={story.id} href={story.href} className="font-bold text-muted transition hover:text-brand">
              {!plain ? <span className="mr-2 text-accent" aria-hidden>●</span> : null}
              {story.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
