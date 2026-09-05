"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
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
  return <form onSubmit={submit} aria-busy={busy} className="rounded-card border border-line bg-surface p-6 sm:p-8">
    <fieldset disabled={busy} className="grid gap-5">
      <label className="font-bold">Nome<input name="authorName" autoComplete="name" required minLength={2} maxLength={80} className={inputClass} /></label>
      <label className="font-bold">E-mail<input name="authorEmail" type="email" autoComplete="email" required maxLength={254} className={inputClass} /></label>
      <label className="font-bold">Assunto<input name="subject" required minLength={3} maxLength={120} className={inputClass} /></label>
      <label className="font-bold">Mensagem<textarea name="content" required minLength={3} maxLength={5000} rows={7} className={inputClass} /></label>
      <div className="sr-only" aria-hidden="true"><label>Empresa<input name="company" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex items-start gap-3 text-sm leading-6"><input name="privacy" type="checkbox" required className="mt-1 size-4" /><span>Li a <Link className="underline" href="/politica-de-privacidade/">política de privacidade</Link>. Meus dados serão usados para atender esta mensagem e não serão publicados.</span></label>
      <button className="min-h-12 rounded-xl bg-brand px-6 py-3 font-bold text-white disabled:opacity-60" type="submit">{busy ? "Enviando…" : "Enviar mensagem"}</button>
    </fieldset>
    <p role="status" aria-live="polite" className="mt-4 text-sm">{feedback}</p>
  </form>;
}
