"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";
import { Brand } from "./brand";
import { navigationLinks } from "./navigation-data";
import { ThemeToggle } from "./theme-toggle";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
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
            className="ml-auto flex h-full w-[min(88vw,25rem)] flex-col bg-surface px-5 pb-8 pt-24 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-1">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-bold hover:bg-canvas"
                >
                  <Icon name={link.icon} className="size-5 text-brand" />
                  {link.label}
                </Link>
              ))}
            </div>
            <p className="mt-auto border-t border-line pt-6 text-sm leading-6 text-muted">
              {siteConfig.shortDescription}
            </p>
          </nav>
        </div>
      ) : null}
    </>
  );
}
