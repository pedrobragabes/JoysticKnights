"use client";

import { useEffect, useState } from "react";

export function SearchInput({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  useEffect(() => {
    if (value.trim().length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/?q=${encodeURIComponent(value.trim())}`, { signal: controller.signal });
        if (!response.ok) return;
        const result = await response.json() as { titles: string[] };
        if (!controller.signal.aborted) setSuggestions(result.titles);
      } catch { /* Suggestions are optional; submitting the search remains available. */ }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value]);
  return <>
    <input id="busca" name="q" type="search" minLength={2} maxLength={100} value={value} onChange={(event) => { setValue(event.target.value); setSuggestions([]); }} list="search-suggestions" autoComplete="off" placeholder="Ex.: GTA VI" className="min-w-0 flex-1 bg-transparent px-3 text-ink outline-none" />
    <datalist id="search-suggestions">{suggestions.map((title) => <option key={title} value={title} />)}</datalist>
  </>;
}
