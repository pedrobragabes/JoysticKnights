import type { Metadata } from "next";
import { ContactForm } from "@/components/editorial/contact-form";
import { siteConfig } from "@/lib/site-config";
export const metadata: Metadata = { title: "Contato", description: "Fale com a equipe: sugestões, correções, parcerias e imprensa.", alternates: { canonical: "/contato/" } };
export default function ContactPage() {
  return <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
    <p className="eyebrow">Fale com a equipe</p>
    <h1 className="font-display my-5 text-5xl font-extrabold tracking-tight">Contato</h1>
    <p className="mb-8 text-lg leading-8 text-muted">Sugestões, correções, parcerias ou imprensa: envie sua mensagem para a equipe do {siteConfig.name}.</p>
    <ContactForm />
  </section>;
}
