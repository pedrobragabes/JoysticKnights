import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[75vh] place-items-center px-4 py-16 text-center">
      <div className="max-w-xl">
        <p className="font-display text-8xl font-extrabold tracking-[-0.08em] text-lilac" aria-hidden>404</p>
        <p className="eyebrow mt-2">Continue?</p>
        <h1 className="font-display text-4xl font-extrabold tracking-[-0.055em] sm:text-5xl">Essa fase ainda não existe.</h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-muted">O link pode ter mudado ou a matéria saiu do ar. Volte ao checkpoint e escolha uma nova rota.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-brand px-6 py-3 text-sm font-black text-white transition hover:bg-brand-strong">Ir para o início</Link>
          <Link href="/buscar/" className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-black transition hover:border-brand hover:text-brand">Buscar matéria</Link>
        </div>
      </div>
    </main>
  );
}
