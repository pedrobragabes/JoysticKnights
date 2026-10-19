import { NextRequest, NextResponse } from "next/server";
import { validRedirectDestination } from "@/lib/redirects";
import { siteConfig } from "@/lib/site-config";

export async function proxy(request: NextRequest) {
  if (process.env.WORDPRESS_REDIRECTS_ENABLED !== "true" || request.method !== "GET" || /\.[a-z0-9]+$/i.test(request.nextUrl.pathname)) return NextResponse.next();
  const path = request.nextUrl.pathname;
  if (!validRedirectDestination(path)) return NextResponse.next();
  try {
    const api = new URL(process.env.WORDPRESS_API_URL ?? siteConfig.defaultWordPressApiUrl);
    api.pathname = api.pathname.replace(/\/wp\/v2\/?$/, "/promogames/v1/resolve-redirect");
    api.searchParams.set("path", path);
    const postId = request.nextUrl.searchParams.get("p");
    if (path === "/" && postId && /^[1-9]\d*$/.test(postId)) api.searchParams.set("postId", postId);
    const result = await fetch(api, { cache: "no-store", signal: AbortSignal.timeout(1500), redirect: "error" });
    const destination: unknown = result.ok ? (await result.json()).destination : null;
    if (validRedirectDestination(destination) && destination !== path) return NextResponse.redirect(new URL(destination, request.nextUrl.origin), 308);
  } catch { /* CMS outages must not prevent normal public routes from loading. */ }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!api|preview|entrar|_next|wp-admin|wp-login|wp-json|wp-content|wp-includes).*)"] };
