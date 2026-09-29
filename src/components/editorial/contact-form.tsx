"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createContactMailto } from "@/lib/contact-mailto";

export function ContactForm({ delivery = "api", email = "", privacyHref = "/politica-de-privacidade/" }: { delivery?: "api" | "email"; email?: string; privacyHref?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [draft, setDraft] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (delivery === "email") {
      if (data.get("company")) return;
      setDraft(createContactMailto(email, { name: String(data.get("authorName") ?? ""), email: String(data.get("authorEmail") ?? ""), subject: String(data.get("subject") ?? ""), content: String(data.get("content") ?? "") }));
      setFeedback("E-mail preparado. Abra seu aplicativo abaixo para revisar e enviar. A mensagem ainda não foi enviada.");
      return;
    }
    setBusy(true); setFeedback("");
    try {
      const response = await fetch("/api/contact/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(data), privacy: data.get("privacy") === "on" }) });
      const result = await response.json();
      if (!response.ok) { setFeedback(result.error || "Não foi possível enviar."); return; }
      form.reset(); setFeedback("Mensagem recebida pela equipe. Obrigado pelo contato!");
    } catch { setFeedback("Falha de conexão. Tente novamente."); }
    finally { setBusy(false); }
  }
  const inputClass = "mt-2 w-full rounded-xl border border-line bg-canvas p-3 font-normal focus:outline-brand";
  return <form onSubmit={submit} onChange={() => { if (draft) { setDraft(""); setFeedback(""); } }} aria-busy={busy} className="rounded-card border border-line bg-surface p-6 sm:p-8">
    {delivery === "email" ? <p className="mb-6 text-sm leading-6 text-muted">Preencha a mensagem e abra no seu aplicativo de e-mail para concluir o envio.</p> : null}
    <fieldset disabled={busy} className="grid gap-5">
      <label className="font-bold">Nome<input name="authorName" autoComplete="name" required minLength={2} maxLength={80} className={inputClass} /></label>
      <label className="font-bold">E-mail<input name="authorEmail" type="email" autoComplete="email" required maxLength={254} className={inputClass} /></label>
      <label className="font-bold">Assunto<input name="subject" required minLength={3} maxLength={120} className={inputClass} /></label>
      <label className="font-bold">Mensagem<textarea name="content" required minLength={3} maxLength={5000} rows={7} className={inputClass} /></label>
      <div className="sr-only" aria-hidden="true"><label>Empresa<input name="company" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex items-start gap-3 text-sm leading-6"><input name="privacy" type="checkbox" required className="mt-1 size-4 shrink-0" /><span>{privacyHref ? <>Li a <Link className="underline" href={privacyHref}>política de privacidade</Link>. </> : "Autorizo o uso do nome e e-mail para responder ao meu contato. "}Meus dados serão usados para atender esta mensagem e não serão publicados.</span></label>
      <button className="min-h-12 rounded-xl bg-brand px-6 py-3 font-bold text-white disabled:opacity-60" type="submit">{busy ? "Enviando…" : delivery === "email" ? "Preparar e-mail" : "Enviar mensagem"}</button>
    </fieldset>
    <p role="status" aria-live="polite" className="mt-4 text-sm">{feedback}</p>
    {draft ? <a href={draft} className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl border border-brand px-5 py-3 text-sm font-bold text-ink">Abrir meu aplicativo de e-mail <span aria-hidden className="ml-3">↗</span></a> : null}
  </form>;
}
