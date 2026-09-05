import type { Story } from "@/lib/wordpress/types";

export function ReviewSummary({ story }: { story: Story }) {
  if (story.editorialType !== "analise") return null;
  const review = story.review;
  const facts = [
    ["Jogo", review?.game], ["Desenvolvedora", review?.developer],
    ["Publisher", review?.publisher], ["Lançamento", review?.releaseDate],
    ["Plataforma analisada", review?.testedPlatform],
  ].filter(([, value]) => value);
  return <section aria-label="Resumo da análise" className="mb-10 rounded-card border border-line bg-surface p-6 sm:p-8">
    <p className="eyebrow">Análise</p>
    <h2 className="font-display text-3xl font-extrabold">{review?.game || story.title}</h2>
    {story.reviewScore !== undefined ? <p className="my-5 text-5xl font-black text-brand" aria-label={`Nota ${story.reviewScore} de 10`}>{story.reviewScore.toFixed(1)}<span className="text-lg text-muted"> / 10</span></p> : null}
    {review?.verdict ? <p className="my-5 leading-7">{review.verdict}</p> : null}
    <div className="grid gap-6 sm:grid-cols-2">
      {([["Prós", review?.pros], ["Contras", review?.cons]] as const).map(([label, items]) => items?.length ? <div key={label}><h3 className="font-bold">{label}</h3><ul className="mt-2 list-disc space-y-2 pl-5">{items.map((item, index) => <li key={index}>{item}</li>)}</ul></div> : null)}
    </div>
    {facts.length ? <dl className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">{facts.map(([label, value]) => <div key={label}><dt className="text-sm text-muted">{label}</dt><dd className="font-bold">{value}</dd></div>)}</dl> : null}
    {review?.disclosure ? <p className="mt-6 border-t border-line pt-4 text-sm text-muted">Transparência: {review.disclosure}</p> : null}
  </section>;
}
