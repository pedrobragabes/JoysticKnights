"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/format";
import type { Story } from "@/lib/wordpress/types";
import { StoryImage } from "./story-image";

function Arrow({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
      <path d={direction === "previous" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeroDeck({ stories }: { stories: Story[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollToIndex = useCallback((requestedIndex: number) => {
    const track = trackRef.current;
    if (!track || !stories.length) return;
    const index = (requestedIndex + stories.length) % stories.length;
    const slide = track.children.item(index) as HTMLElement | null;
    if (!slide) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
    setActiveIndex(index);
  }, [stories.length]);

  useEffect(() => {
    if (paused || stories.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => scrollToIndex(activeIndex + 1), 6500);
    return () => window.clearInterval(timer);
  }, [activeIndex, paused, scrollToIndex, stories.length]);

  function updateActiveSlide() {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    const nearest = slides.reduce((best, slide, index) => {
      const distance = Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Number.POSITIVE_INFINITY });
    setActiveIndex(nearest.index);
  }

  if (!stories.length) return null;

  return (
    <section
      aria-label="Posts em destaque"
      aria-roledescription="carrossel"
      data-testid="featured-carousel"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div
        ref={trackRef}
        onScroll={updateActiveSlide}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      >
        {stories.map((story, index) => (
          <Link
            key={story.id}
            href={story.href}
            aria-label={`${index + 1} de ${stories.length}: ${story.title}`}
            className="story-link group relative min-h-[430px] basis-[84%] flex-none snap-start overflow-hidden rounded-card bg-[#151219] text-white sm:basis-[48%] lg:basis-[calc((100%-0.75rem)/2)] xl:basis-[calc((100%-1.5rem)/3)]"
          >
            <StoryImage
              image={story.image}
              alt={story.title}
              priority={index < 2}
              sizes="(max-width: 640px) 84vw, (max-width: 1280px) 48vw, 33vw"
              className="absolute inset-0 h-full transition duration-500 group-hover:scale-[1.035]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.09em]">
                <span className="rounded-full bg-accent px-2.5 py-1">{story.primaryCategory?.name ?? "Destaque"}</span>
                <span className="text-white/70">{formatDate(story.publishedAt)}</span>
              </div>
              <h2 className="font-display line-clamp-4 text-[1.45rem] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[1.6rem]">
                {story.title}
              </h2>
            </div>
          </Link>
        ))}
      </div>

      {stories.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            aria-label="Destaque anterior"
            className="absolute left-1 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/75 text-white shadow-xl backdrop-blur transition hover:scale-105 hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-3"
          >
            <Arrow direction="previous" />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            aria-label="Próximo destaque"
            className="absolute right-1 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/75 text-white shadow-xl backdrop-blur transition hover:scale-105 hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-3"
          >
            <Arrow direction="next" />
          </button>
          <div className="mt-2 flex items-center justify-center gap-2" aria-label="Escolher destaque">
            {stories.map((story, index) => (
              <button
                key={story.id}
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-label={`Ir para destaque ${index + 1}`}
                aria-current={activeIndex === index ? "true" : undefined}
                className={`h-2 rounded-full transition-all ${activeIndex === index ? "w-8 bg-brand" : "w-2 bg-line hover:bg-muted"}`}
              />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">Destaque {activeIndex + 1} de {stories.length}</p>
        </>
      ) : null}
    </section>
  );
}
