import "server-only";
import { siteConfig } from "@/lib/site-config";

export class WordPressApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly path?: string,
    readonly code?: string,
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
const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

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
  let response: Response | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        ...init,
        headers: {
          Accept: "application/json",
          ...init?.headers,
        },
        ...(attempt === 1 ? cacheOptions : { cache: "no-store" }),
      });
    } catch {
      if (attempt === MAX_ATTEMPTS) throw new WordPressApiError("Não foi possível conectar ao WordPress.", 503, url.pathname);
      await new Promise((resolve) => setTimeout(resolve, attempt * 200));
      continue;
    }
    if (response.ok || !TRANSIENT_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) break;

    await response.body?.cancel();
    await new Promise((resolve) => setTimeout(resolve, attempt * 200));
  }

  if (!response?.ok) {
    const payload = await response?.json().catch(() => null) as { code?: string } | null;
    throw new WordPressApiError(
      `WordPress respondeu ${response?.status ?? "sem resposta"} para ${url.pathname}`,
      response?.status,
      url.pathname,
      payload?.code,
    );
  }

  return {
    data: (await response.json()) as T,
    total: Number(response.headers.get("x-wp-total") ?? 0),
    totalPages: Number(response.headers.get("x-wp-totalpages") ?? 0),
  };
}
