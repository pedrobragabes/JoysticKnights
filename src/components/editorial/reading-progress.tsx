"use client";

import { useEffect, useRef } from "react";

export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const body = document.getElementById("article-content");
        if (!body || !bar.current) return;
        const rect = body.getBoundingClientRect();
        const distance = Math.max(1, rect.height - window.innerHeight);
        bar.current.style.transform = `scaleX(${Math.min(1, Math.max(0, -rect.top / distance))})`;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    const body = document.getElementById("article-content");
    if (body) observer.observe(body);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  return <div ref={bar} aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 origin-left bg-brand" style={{ transform: "scaleX(0)" }} />;
}
