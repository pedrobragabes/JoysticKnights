import type { Metadata } from "next";
import { HeroDeck } from "@/components/editorial/hero-deck";
import { Radar } from "@/components/editorial/radar";
import { SectionHeader } from "@/components/editorial/section-header";
import { StoryCard, StoryListItem } from "@/components/editorial/story-card";
import { AdSlot } from "@/components/platform/ad-slot";
import { getCategoryHref, siteConfig } from "@/lib/site-config";
import { getCategories, getHomepageStories } from "@/lib/wordpress/queries";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [{ items: stories }, categories] = await Promise.all([
    getHomepageStories(18),
    getCategories(),
  ]);

  const heroStories = stories.slice(0, 4);
  const highlights = stories.slice(4, 12);
  const latest = stories.slice(12);
  const channels = siteConfig.featuredChannelSlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category) => category !== undefined);

  return (
    <div className="pb-20">
      <Radar stories={stories.slice(0, 5)} />

      <section className="px-4 pt-6 sm:px-6 lg:px-10 lg:pt-9">
        <div className="mx-auto max-w-[1460px]">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Seleção da redação</p>
              <h1 className="font-display text-3xl font-extrabold tracking-[-0.045em] text-ink sm:text-4xl">
                No controle agora
              </h1>
            </div>
            <span className="hidden text-sm font-semibold text-muted sm:block">
              Conteúdo novo. Sem enrolação.
            </span>
          </div>
          <HeroDeck stories={heroStories} />
        </div>
      </section>

      <div className="px-4 pt-8 sm:px-6 lg:px-10"><div className="mx-auto max-w-[1460px]"><AdSlot name="home-top" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP} /></div></div>

      <section className="px-4 pt-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1460px]">
          <SectionHeader
            eyebrow="Em alta"
            title="Mais destaques"
            href={getCategoryHref("noticias")}
            linkLabel="Todas as notícias"
          />
          <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 xl:grid-cols-4">
            {highlights.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16 border-y border-line bg-[#151219] px-4 py-12 text-white sm:px-6 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1460px]">
          <p className="eyebrow text-lilac">Escolha seu universo</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {channels.map((channel, index) => (
              <a
                key={channel.id}
                href={getCategoryHref(channel.slug)}
                className="group relative min-h-44 overflow-hidden rounded-card border border-white/15 p-6 text-white transition hover:-translate-y-1 hover:border-lilac focus-visible:outline-lilac"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-50 transition duration-300 group-hover:scale-105 group-hover:opacity-80"
                  style={{
                    background: [
                      "radial-gradient(circle at 80% 15%, #7c3aed, transparent 52%), #17131d",
                      "radial-gradient(circle at 80% 15%, #32d583, transparent 52%), #17131d",
                      "radial-gradient(circle at 80% 15%, #f04476, transparent 52%), #17131d",
                      "radial-gradient(circle at 80% 15%, #ffb000, transparent 52%), #17131d",
                    ][index],
                  }}
                />
                <div className="relative flex h-full flex-col justify-between">
                  <span className="font-display text-3xl font-extrabold tracking-tight">
                    {channel.name}
                  </span>
                  <span className="mt-12 text-sm font-bold text-white/70">
                    {channel.count ?? 0} matérias <span aria-hidden>↗</span>
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {latest.length > 0 ? (
        <section className="px-4 pt-16 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1460px]">
            <SectionHeader eyebrow="Feed" title="Acabou de sair" />
            <div className="divide-y divide-line border-y border-line">
              {latest.map((story) => (
                <StoryListItem key={story.id} story={story} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {process.env.NEXT_PUBLIC_NEWSLETTER_ACTION ? <section id="newsletter" className="px-4 pt-16 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1460px] overflow-hidden rounded-card bg-brand text-white lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-7 sm:p-10 lg:p-14">
            <p className="eyebrow text-white/70">Checkpoint semanal</p>
            <h2 className="font-display max-w-2xl text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">
              O melhor dos games, sem zerar o seu tempo.
            </h2>
          </div>
          <div className="flex items-center bg-white/10 p-7 sm:p-10 lg:p-14">
            <form className="flex w-full flex-col gap-3 sm:flex-row" action={process.env.NEXT_PUBLIC_NEWSLETTER_ACTION} method="post">
              <label className="sr-only" htmlFor="newsletter-email">
                Seu melhor e-mail
              </label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="voce@email.com"
                className="min-h-12 flex-1 rounded-full border border-white/30 bg-white px-5 text-[#151219] outline-none placeholder:text-[#6c6671] focus:border-[#151219]"
              />
              <button className="min-h-12 rounded-full bg-[#151219] px-6 text-sm font-extrabold text-white transition hover:bg-brand-strong">
                Quero receber
              </button>
            </form>
          </div>
        </div>
      </section> : null}
    </div>
  );
}
