import Link from "next/link";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/editorial/archive";
import { HeroDeck } from "@/components/editorial/hero-deck";
import { Radar } from "@/components/editorial/radar";
import { SectionHeader } from "@/components/editorial/section-header";
import { StoryCard, StoryListItem } from "@/components/editorial/story-card";
import { Icon } from "@/components/icons";
import { AdSlot } from "@/components/platform/ad-slot";
import { getCategoryHref, siteConfig } from "@/lib/site-config";
import { getCategories, getHomepageStories, getStories } from "@/lib/wordpress/queries";

const FEATURED_STORY_COUNT = 16;
const FEED_PAGE_SIZE = 12;

export async function EditorialHome({ page = 1, basePath = "/" }: { page?: number; basePath?: string }) {
  const [featuredStories, categories, feed] = await Promise.all([
    page === 1 ? getHomepageStories(FEATURED_STORY_COUNT).then((result) => result.items) : Promise.resolve([]),
    page === 1 ? getCategories() : Promise.resolve([]),
    getStories({ page, perPage: FEED_PAGE_SIZE }),
  ]);
  if (page > 1 && (feed.totalPages === 0 || page > feed.totalPages)) notFound();

  // Send only the fields the interactive carousel renders to the browser.
  const heroStories = featuredStories.slice(0, 8).map(({ id, href, title, publishedAt, image }) => ({
    id, href, title, publishedAt,
    image: image ? { url: image.url, alt: image.alt, width: image.width, height: image.height } : undefined,
  }));
  const channels = siteConfig.featuredChannelSlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category) => category !== undefined);

  return <div className="pb-20">
    {page === 1 ? <>
      <Radar stories={featuredStories.slice(0, 5)} plain />
      <section className="px-4 pt-6 sm:px-6 lg:px-10 lg:pt-9">
        <div className="mx-auto max-w-[1460px]">
          <h1 className="font-display mb-5 text-3xl font-extrabold tracking-[-0.045em] text-ink sm:text-4xl">Notícias</h1>
          <HeroDeck stories={heroStories} showCategoryBadge={false} />
        </div>
      </section>
      <AdSlot name="home-top" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP} className="mx-4 mt-8 sm:mx-6 lg:mx-10 2xl:mx-auto 2xl:max-w-[1460px]" />
      <section className="px-4 pt-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1460px]">
          <SectionHeader title="Destaques" href={getCategoryHref("noticias")} linkLabel="Todas as notícias" />
          <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 xl:grid-cols-4">
            {featuredStories.slice(8, 16).map((story) => <StoryCard key={story.id} story={story} />)}
          </div>
        </div>
      </section>
      <section className="mt-16 border-y border-line bg-surface px-4 py-12 text-ink sm:px-6 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1460px]">
          <h2 className="font-display mb-6 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Plataformas</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {channels.map((channel) => <Link key={channel.id} href={getCategoryHref(channel.slug)} className="group rounded-xl border border-line p-5 transition hover:border-brand">
              <span className="flex items-center gap-3 font-display text-xl font-extrabold tracking-tight">
                <Icon name={siteConfig.navigationCategories.find((item) => item.slug === channel.slug)?.icon ?? "news"} className="size-6 text-brand" />
                {channel.name}
              </span>
              <span className="mt-5 block text-sm font-bold text-muted">{channel.count ?? 0} matérias <span aria-hidden>↗</span></span>
            </Link>)}
          </div>
        </div>
      </section>
    </> : null}
    <section className={`px-4 sm:px-6 lg:px-10 ${page === 1 ? "pt-16" : "pt-12 lg:pt-16"}`}>
      <div className="mx-auto max-w-[1460px]">
        {page > 1 ? <h1 className="font-display mb-6 border-b border-line pb-4 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Últimas publicações — página {page}</h1> : <SectionHeader title="Últimas publicações" />}
        {feed.items.length ? <div className="divide-y divide-line border-y border-line">
          {feed.items.map((story) => <StoryListItem key={story.id} story={story} />)}
        </div> : <div className="rounded-card border border-dashed border-line bg-surface px-6 py-16 text-center"><p className="font-display text-2xl font-extrabold">Nenhuma notícia disponível no momento.</p></div>}
        <Pagination basePath={basePath} page={feed.page} totalPages={feed.totalPages} />
      </div>
    </section>
    {page === 1 && process.env.NEXT_PUBLIC_NEWSLETTER_ACTION ? <section id="newsletter" className="px-4 pt-16 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1460px] overflow-hidden rounded-card bg-brand text-white lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-7 sm:p-10 lg:p-14">
          <p className="eyebrow text-white/70">Newsletter</p>
          <h2 className="font-display max-w-2xl text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">Receba as publicações por e-mail.</h2>
        </div>
        <div className="flex items-center bg-white/10 p-7 sm:p-10 lg:p-14">
          <form className="flex w-full flex-col gap-3 sm:flex-row" action={process.env.NEXT_PUBLIC_NEWSLETTER_ACTION} method="post">
            <label className="sr-only" htmlFor="newsletter-email">Seu melhor e-mail</label>
            <input id="newsletter-email" type="email" name="email" required autoComplete="email" placeholder="voce@email.com" className="min-h-12 min-w-0 flex-1 rounded-full border border-white/30 bg-white px-5 text-[#151219] outline-none placeholder:text-[#6c6671] focus:border-[#151219]" />
            <button className="min-h-12 rounded-full bg-[#151219] px-6 text-sm font-extrabold text-white transition hover:bg-brand-strong">Quero receber</button>
          </form>
        </div>
      </div>
    </section> : null}
  </div>;
}
