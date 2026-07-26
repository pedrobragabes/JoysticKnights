"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error("[joysticknights] Falha inesperada de renderização", error);
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-16 text-center">
      <div className="max-w-lg rounded-card border border-line bg-surface p-8 shadow-[0_20px_70px_rgb(21_18_25_/_8%)]">
        <p className="eyebrow">Respawn necessário</p>
        <h1 className="font-display text-4xl font-extrabold tracking-[-0.05em]">Algo interrompeu esta fase.</h1>
        <p className="mt-4 leading-7 text-muted">A conexão com a redação pode ter oscilado. Tente carregar o conteúdo novamente.</p>
        <button type="button" onClick={() => unstable_retry()} className="mt-7 rounded-full bg-brand px-6 py-3 text-sm font-black text-white transition hover:bg-brand-strong">Tentar novamente</button>
      </div>
    </main>
  );
}
