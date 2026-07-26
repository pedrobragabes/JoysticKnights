import "server-only";
import { siteConfig } from "@/lib/site-config";

export class WordPressApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly path?: string,
  ) {
    super(message);
    this.name = "WordPressApiError";
  }
}

export type WordPressResponse<T> = {
  data: T;
  total: number;
  totalPages: number;
};

type QueryValue = string | number | boolean | Array<string | number> | undefined;

export function getWordPressApiUrl() {
  return (process.env.WORDPRESS_API_URL ?? siteConfig.defaultWordPressApiUrl).replace(/\/$/, "");
}

export function getWordPressRestUrl(path: string) {
  const url = new URL(getWordPressApiUrl());
  const normalizedPath = path.replace(/^\/+|\/+$/g, "");
  if (!/\/wp\/v2\/?$/.test(url.pathname)) {
    throw new WordPressApiError("WORDPRESS_API_URL precisa terminar em /wp-json/wp/v2.");
  }
  url.pathname = url.pathname.replace(/\/wp\/v2\/?$/, `/${normalizedPath}`);
  url.search = "";
  url.hash = "";
  return url;
}

function createUrl(path: string, query: Record<string, QueryValue>) {
  const url = new URL(`${getWordPressApiUrl()}${path.startsWith("/") ? path : `/${path}`}`);

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }

  return url;
}

export async function wordPressRequest<T>(
  path: string,
  query: Record<string, QueryValue> = {},
  tags: string[] = ["wordpress"],
  init?: RequestInit,
): Promise<WordPressResponse<T>> {
  const url = createUrl(path, query);
  const cacheOptions = init?.cache === "no-store"
    ? {}
    : { next: { revalidate: 300, tags } };
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    ...cacheOptions,
  });

  if (!response.ok) {
    throw new WordPressApiError(
      `WordPress respondeu ${response.status} para ${url.pathname}`,
      response.status,
      url.pathname,
    );
  }

  return {
    data: (await response.json()) as T,
    total: Number(response.headers.get("x-wp-total") ?? 0),
    totalPages: Number(response.headers.get("x-wp-totalpages") ?? 0),
  };
}
