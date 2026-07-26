"use client";

import Image from "next/image";
import { type KeyboardEvent, type MouseEvent, useCallback, useEffect, useRef, useState } from "react";

type GalleryImage = {
  src: string;
  alt: string;
  caption?: string;
};

function bestImageSource(image: HTMLImageElement) {
  const candidates = (image.getAttribute("srcset") ?? "")
    .split(",")
    .map((candidate) => {
      const [src, descriptor = "1"] = candidate.trim().split(/\s+/);
      const score = Number.parseFloat(descriptor) || 1;
      return { src, score };
    })
    .filter((candidate) => candidate.src)
    .sort((left, right) => right.score - left.score);
  return candidates[0]?.src || image.currentSrc || image.getAttribute("src") || "";
}

function Arrow({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-6 fill-none stroke-current stroke-2">
      <path d={direction === "previous" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArticleGallery({ html }: { html: string }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLImageElement | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => {
    setActiveIndex(null);
    window.setTimeout(() => openerRef.current?.focus(), 0);
  }, []);

  const move = useCallback((direction: -1 | 1) => {
    setActiveIndex((current) => {
      if (current === null || !images.length) return current;
      return (current + direction + images.length) % images.length;
    });
  }, [images.length]);

  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;
    const articleImages = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
    articleImages.forEach((image) => {
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `${image.alt || "Imagem da matéria"}. Clique para ampliar.`);
    });
  }, [html]);

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex, close, move]);

  function collectImages() {
    const container = bodyRef.current;
    if (!container) return [];
    const seen = new Set<string>();
    return Array.from(container.querySelectorAll<HTMLImageElement>("img")).flatMap((image) => {
      const rawSrc = bestImageSource(image);
      if (!rawSrc) return [];
      const src = new URL(rawSrc, window.location.href).href;
      if (seen.has(src)) return [];
      seen.add(src);
      const caption = image.closest("figure")?.querySelector("figcaption")?.textContent?.trim();
      return [{ src, alt: image.alt || "Imagem da matéria", caption }];
    });
  }

  function openImage(image: HTMLImageElement) {
    const gallery = collectImages();
    const rawSrc = bestImageSource(image);
    if (!rawSrc || !gallery.length) return;
    const source = new URL(rawSrc, window.location.href).href;
    const index = Math.max(0, gallery.findIndex((item) => item.src === source));
    openerRef.current = image;
    setImages(gallery);
    setActiveIndex(index);
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLImageElement)) return;
    event.preventDefault();
    openImage(event.target);
  }

  function handleBodyKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLImageElement) || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    openImage(event.target);
  }

  const activeImage = activeIndex === null ? undefined : images[activeIndex];

  return (
    <>
      <div ref={bodyRef} className="article-body" onClick={handleClick} onKeyDown={handleBodyKeyDown} dangerouslySetInnerHTML={{ __html: html }} />

      {activeImage ? (
        <div className="fixed inset-0 z-[100] grid overflow-hidden bg-black/95 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <div role="dialog" aria-modal="true" aria-label="Galeria de imagens da matéria" className="relative m-auto flex h-full min-w-0 w-full max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden sm:max-w-[calc(100vw-3rem)] 2xl:max-w-[1500px]">
            <div className="mb-3 flex items-center justify-between gap-4 text-white">
              <p className="text-sm font-bold">Imagem {activeIndex! + 1} de {images.length}</p>
              <button ref={closeRef} type="button" onClick={close} className="z-10 grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 text-xl transition hover:bg-white/20" aria-label="Fechar galeria">×</button>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden rounded-card bg-black">
              <Image fill unoptimized priority src={activeImage.src} alt={activeImage.alt} sizes="100vw" className="object-contain" />
              {images.length > 1 ? (
                <>
                  <button type="button" onClick={() => move(-1)} className="absolute left-2 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/70 text-white transition hover:bg-brand sm:left-5" aria-label="Imagem anterior"><Arrow direction="previous" /></button>
                  <button type="button" onClick={() => move(1)} className="absolute right-2 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/70 text-white transition hover:bg-brand sm:right-5" aria-label="Próxima imagem"><Arrow direction="next" /></button>
                </>
              ) : null}
            </div>

            {activeImage.caption ? <p className="mx-auto mt-3 max-w-4xl text-center text-sm leading-6 text-white/75">{activeImage.caption}</p> : null}

            {images.length > 1 ? (
              <div className="scrollbar-none mt-3 flex w-full min-w-0 justify-start gap-2 overflow-x-auto sm:justify-center" aria-label="Miniaturas da galeria">
                {images.map((image, index) => (
                  <button key={`${image.src}-${index}`} type="button" onClick={() => setActiveIndex(index)} aria-label={`Abrir imagem ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} className={`relative h-14 w-20 flex-none overflow-hidden rounded-lg border-2 transition ${index === activeIndex ? "border-brand" : "border-transparent opacity-55 hover:opacity-100"}`}>
                    <Image fill unoptimized src={image.src} alt="" sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
