"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";
import { Brand } from "./brand";
import { NavigationLinks } from "./navigation-links";
import { ThemeToggle } from "./theme-toggle";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-canvas/95 px-4 backdrop-blur lg:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link aria-label="Buscar" href="/buscar/" className="grid size-11 place-items-center rounded-full hover:bg-surface">
            <Icon name="search" />
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            disabled={!ready}
            onClick={() => setOpen((value) => !value)}
            className="grid size-11 place-items-center rounded-full hover:bg-surface disabled:cursor-wait"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </header>
      {open ? (
        <div className="fixed inset-0 z-30 bg-[#151219]/55 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <nav
            id="mobile-navigation"
            aria-label="Navegação principal"
            className="ml-auto flex h-full w-[min(88vw,25rem)] flex-col overflow-y-auto overscroll-contain bg-surface px-5 pb-8 pt-24 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shrink-0 space-y-1">
              <NavigationLinks mobile onNavigate={() => setOpen(false)} />
            </div>
            <p className="mt-auto shrink-0 border-t border-line pt-6 text-sm leading-6 text-muted">
              {siteConfig.shortDescription}
            </p>
          </nav>
        </div>
      ) : null}
    </>
  );
}
