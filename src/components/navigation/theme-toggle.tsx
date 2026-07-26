"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";

type Theme = "dark" | "light";

const storageKey = "joysticknights-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const transitionTimer = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    }, 0);

    return () => {
      window.clearTimeout(timer);
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    };
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) root.classList.add("theme-transitioning");
    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;
    setTheme(nextTheme);

    try {
      window.localStorage.setItem(storageKey, nextTheme);
    } catch {
      // A troca continua funcionando quando o navegador bloqueia armazenamento local.
    }

    if (!reduceMotion) {
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
      transitionTimer.current = window.setTimeout(() => {
        root.classList.remove("theme-transitioning");
        transitionTimer.current = null;
      }, 420);
    }
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      className="theme-toggle relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-canvas text-ink shadow-sm transition hover:border-brand hover:text-brand"
    >
      <Icon
        name="sun"
        className={`absolute size-[1.15rem] transition duration-300 ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`}
      />
      <Icon
        name="moon"
        className={`absolute size-[1.05rem] transition duration-300 ${isDark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
      />
    </button>
  );
}
