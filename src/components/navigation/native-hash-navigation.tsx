"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Imported WordPress HTML contains native anchors. Keep their history entries
// inside the App Router so Back restores the article as well as its URL.
export function NativeHashNavigation() {
  const router = useRouter();
  useEffect(() => {
    function navigate(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const destination = new URL(link.href, window.location.href);
      if (!destination.hash || destination.origin !== window.location.origin || destination.pathname.startsWith("//") || destination.pathname !== window.location.pathname || destination.search !== window.location.search) return;
      event.preventDefault();
      // Only a same-origin, same-document path is passed to the router.
      router.push(`${destination.pathname}${destination.search}${destination.hash}`);
    }
    document.addEventListener("click", navigate);
    return () => document.removeEventListener("click", navigate);
  }, [router]);
  return null;
}
