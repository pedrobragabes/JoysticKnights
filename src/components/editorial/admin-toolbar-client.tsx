"use client";

import { useEffect, useState } from "react";

type Links = Partial<Record<"edit" | "preview" | "dashboard" | "home", string>>;
const labels = { edit: "Editar matéria", preview: "Prévia", dashboard: "Painel e métricas", home: "Editar página inicial" };

export function AdminToolbarClient({ endpoint, postId }: { endpoint: string; postId: number }) {
  const [links, setLinks] = useState<Links | null>(null);
  useEffect(() => {
    let controller: AbortController | undefined;
    const refresh = async () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      try {
        const url = new URL(endpoint);
        url.searchParams.set("action", "promogames_editor_toolbar");
        url.searchParams.set("post_id", String(postId));
        const response = await fetch(url, { credentials: "include", cache: "no-store", signal: request.signal });
        if (!response.ok) { setLinks(null); return; }
        const payload = await response.json();
        const safe: Links = {};
        if (payload.success && payload.data) for (const key of Object.keys(labels) as (keyof Links)[]) {
          const href = payload.data[key];
          if (typeof href !== "string") continue;
          const target = new URL(href);
          if (target.origin === url.origin && target.pathname.startsWith("/wp-admin/") && !target.username && !target.password) safe[key] = target.href;
        }
        setLinks(Object.keys(safe).length ? safe : null);
      } catch { if (!request.signal.aborted) setLinks(null); }
    };
    void refresh();
    window.addEventListener("focus", refresh);
    return () => { controller?.abort(); window.removeEventListener("focus", refresh); };
  }, [endpoint, postId]);
  if (!links) return null;
  return <nav aria-label="Administração JoysticKnights" className="border-b border-line bg-surface px-4 py-3 text-sm sm:px-6">
    <div className="mx-auto flex max-w-[1220px] flex-wrap items-center gap-x-5 gap-y-2">
      <span className="font-bold text-muted">Administração</span>
      {(Object.keys(labels) as (keyof Links)[]).map((key) => links[key] ? <a key={key} href={links[key]} className="inline-flex min-h-11 items-center font-bold text-brand underline-offset-4 hover:underline">{labels[key]}</a> : null)}
    </div>
  </nav>;
}
