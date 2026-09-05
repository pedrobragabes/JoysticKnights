import { writeFile } from "node:fs/promises";

const origin = new URL(process.argv[2] ?? "https://joysticknights.com.br").origin;
const sitemap = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(30000) });
if (!sitemap.ok) throw new Error(`Sitemap HTTP ${sitemap.status}`);
const xml = await sitemap.text();
// Match URL entries only, excluding image:loc and sitemap namespace entries.
const urls = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll("&amp;", "&"));
if (!urls.length) throw new Error("O sitemap não contém URLs públicas.");
const results = [];
let cursor = 0;
await Promise.all(Array.from({ length: 1 }, async () => {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    if (new URL(url).origin !== origin) { results.push({ url, error: "Host incorreto no sitemap" }); continue; }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const html = await response.text();
      const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1]?.replaceAll("&amp;", "&");
      const noindex = /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html) || /noindex/i.test(response.headers.get("x-robots-tag") ?? "");
      const normalize = (value) => new URL(value).href.replace(/\/$/, "");
      results.push({ url, status: response.status, canonical, noindex, passed: response.status === 200 && !noindex && Boolean(canonical) && normalize(canonical) === normalize(url) });
    } catch (error) { results.push({ url, passed: false, error: String(error) }); }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}));
const report = { checkedAt: new Date().toISOString(), origin, total: results.length, failures: results.filter((item) => !item.passed), results };
if (process.argv[3]) await writeFile(process.argv[3], JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ origin, total: report.total, failures: report.failures }, null, 2));
if (report.failures.length) process.exitCode = 1;
