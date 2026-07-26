import Image from "next/image";
import Link from "next/link";
import type { Paginated, Story } from "@/lib/wordpress/types";
import { StoryCard } from "./story-card";

export function ArchiveHeader({
  eyebrow,
  title,
  description,
  count,
  avatarUrl,
}: {
  eyebrow: string;
  title: string;
  description: string;
  count?: number;
  avatarUrl?: string;
}) {
  return (
    <header className="border-b border-line bg-surface px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <div className="mx-auto flex max-w-[1220px] items-end justify-between gap-8">
        <div className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <div className="flex items-center gap-4">
            {avatarUrl ? <Image src={avatarUrl} width={72} height={72} alt="" className="size-14 rounded-full sm:size-[72px]" /> : null}
            <h1 className="font-display text-balance text-[clamp(2.6rem,7vw,6rem)] font-extrabold leading-[0.93] tracking-[-0.065em]">{title}</h1>
          </div>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">{description}</p>
        </div>
        {typeof count === "number" ? (
          <p className="hidden shrink-0 text-right sm:block">
            <span className="font-display block text-4xl font-extrabold tracking-[-0.05em]">{count}</span>
            <span className="text-xs font-black uppercase tracking-[0.1em] text-muted">matérias</span>
          </p>
        ) : null}
      </div>
    </header>
  );
}

export function StoryArchive({ result, emptyMessage, query }: { result: Paginated<Story>; emptyMessage: string; query?: Record<string, string> }) {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <div className="mx-auto max-w-[1220px]">
        {result.items.length ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((story, index) => <StoryCard key={story.id} story={story} priority={index === 0} />)}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-line bg-surface px-6 py-16 text-center">
            <p className="font-display text-2xl font-extrabold">{emptyMessage}</p>
            <Link href="/" className="mt-4 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-black text-white transition hover:bg-brand-strong">Voltar para o início</Link>
          </div>
        )}
        <Pagination page={result.page} totalPages={result.totalPages} query={query} />
      </div>
    </section>
  );
}

export function Pagination({ page, totalPages, query }: { page: number; totalPages: number; query?: Record<string, string> }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1);

  return (
    <nav className="mt-14 flex flex-wrap items-center justify-center gap-2" aria-label="Paginação">
      <PageLink page={page - 1} disabled={page <= 1} label="Anterior" query={query} />
      {pages.map((item, index) => (
        <span key={item} className="contents">
          {index > 0 && item - pages[index - 1] > 1 ? <span className="px-1 text-muted" aria-hidden>…</span> : null}
          <PageLink page={item} current={item === page} label={String(item)} query={query} />
        </span>
      ))}
      <PageLink page={page + 1} disabled={page >= totalPages} label="Próxima" query={query} />
    </nav>
  );
}

function PageLink({ page, label, current = false, disabled = false, query }: { page: number; label: string; current?: boolean; disabled?: boolean; query?: Record<string, string> }) {
  const className = `grid min-h-11 min-w-11 place-items-center rounded-full border px-4 text-sm font-black transition ${
    current ? "border-brand bg-brand text-white" : disabled ? "pointer-events-none border-line text-muted opacity-45" : "border-line bg-surface hover:border-brand hover:text-brand"
  }`;

  if (disabled) return <span className={className} aria-disabled>{label}</span>;
  const params = new URLSearchParams({ ...query, page: String(page) });
  return <Link href={`?${params}`} className={className} aria-current={current ? "page" : undefined}>{label}</Link>;
}
