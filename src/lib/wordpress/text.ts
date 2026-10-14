const namedEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) =>
      namedEntities[name.toLowerCase()] ?? match,
    );
}

// Imported editorial copy can contain escaped AI citation components. These
// are tooling markers, not source links; preserve ordinary citations and HTML.
export function stripEditorialMarkers(value: string) {
  return value
    .replace(/(?:<|&lt;|&#0*60;|&#x0*3c;)\s*Cite\b\s+refs\s*=\s*\{\s*\[[\s\S]*?\]\s*\}\s*\/\s*(?:>|&gt;|&#0*62;|&#x0*3e;)/gi, "")
    .replace(/\uE200cite\uE202[^\uE201]*\uE201/g, "");
}

export function plainText(value: string) {
  return decodeHtmlEntities(
    stripEditorialMarkers(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(value: string, maxLength = 240) {
  const normalized = plainText(value);
  if (normalized.length <= maxLength) return normalized;

  const slice = normalized.slice(0, maxLength + 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > maxLength * 0.7 ? lastSpace : maxLength).trim()}…`;
}

export function slugifyHeading(value: string) {
  return plainText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "secao";
}

export function readingTime(value: string) {
  const words = plainText(value).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
