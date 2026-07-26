import Link from "next/link";

export function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-5 border-b border-line pb-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">{title}</h2>
      </div>
      {href && linkLabel ? (
        <Link href={href} className="shrink-0 text-xs font-black uppercase tracking-[0.08em] text-brand hover:text-accent">
          {linkLabel} <span aria-hidden>→</span>
        </Link>
      ) : null}
    </div>
  );
}
