export type EditorialFixture = {
  profile: "promogames" | "joysticknights";
  siteName: string;
  apiBase: string;
  story: { id: number; slug: string; title: string; path: string };
  category: { id: number; slug: string; title: string; path: string; count: number };
  categories: Array<{ id: number; slug: string; title: string; path: string; count: number }>;
  page: { id: number; slug: string; title: string; path: string };
  searchTerm: string;
};

export function getEditorialFixture() {
  const serialized = process.env.E2E_EDITORIAL_FIXTURE;
  if (!serialized) throw new Error("O global setup não forneceu E2E_EDITORIAL_FIXTURE.");
  return JSON.parse(serialized) as EditorialFixture;
}

export function normalizePathname(pathname: string) {
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
