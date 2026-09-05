export function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function getPaginationHref(page: number, query?: Record<string, string>, basePath?: string) {
  if (basePath && !query) return page > 1 ? `${basePath.replace(/\/$/, "")}/page/${page}/` : basePath;
  const params = new URLSearchParams(query);
  if (page > 1) params.set("page", String(page));
  return params.size ? `?${params}` : "./";
}
