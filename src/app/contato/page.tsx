import type { Metadata } from "next";
import { ContactForm } from "@/components/editorial/contact-form";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a equipe: sugestões, correções, parcerias e imprensa.",
  alternates: { canonical: "/contato/" },
};

export default function ContactPage() {
  return <section className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
    <div className="mb-10 border-b border-line pb-8">
      <p className="text-sm font-semibold text-brand">{siteConfig.name}</p>
      <h1 className="font-display my-4 text-5xl font-extrabold tracking-tight sm:text-6xl">Contato</h1>
      <p className="max-w-2xl text-lg leading-8 text-muted">Sugestões, correções, parcerias ou imprensa. Fale com a nossa equipe.</p>
    </div>
    <div className="grid items-start gap-8 xl:grid-cols-[0.8fr_1.2fr] xl:gap-12">
      <div className="min-w-0">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Como podemos ajudar?</h2>
        <p className="mt-4 text-base leading-7 text-muted">Se encontrou um problema no site ou em alguma publicação, inclua o link e conte o que aconteceu. Para parcerias, apresente sua proposta e como podemos entrar em contato.</p>
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
          <p className="mb-3 text-sm font-bold">Prefere enviar diretamente?</p>
          <a href={`mailto:${siteConfig.contactEmail}`} aria-label={`Enviar e-mail para ${siteConfig.contactEmail}`} className="break-all text-base font-bold text-brand underline underline-offset-4 sm:text-lg">{siteConfig.contactEmail}</a>
          <p className="mt-4 text-sm leading-6 text-muted">Use o formulário ou escreva para o nosso e-mail.</p>
        </div>
      </div>
      <ContactForm delivery={process.env.WORDPRESS_COMMENTS_SECRET ? "api" : "email"} email={siteConfig.contactEmail} />
    </div>
  </section>;
}
