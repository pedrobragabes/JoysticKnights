import { cookies, draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { exchangePreviewCode, previewCookie, signPreviewScope } from "@/lib/wordpress/preview";
import { getSiteUrl } from "@/lib/site-config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const publicUrl = new URL(getSiteUrl());
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" };
  const scope = await exchangePreviewCode(url.searchParams.get("code") ?? "");
  const signed = scope && signPreviewScope(scope);
  if (!scope || !signed) return Response.json({ error: "Preview não autorizado ou expirado. Abra uma nova prévia pelo CMS." }, { status: 401, headers });
  (await cookies()).set(previewCookie, signed, { httpOnly: true, secure: publicUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: Math.max(1, scope.expiresAt - Math.floor(Date.now() / 1000)) });
  const draft = await draftMode();
  draft.enable();
  return NextResponse.redirect(new URL(`/preview/${scope.postId}/`, publicUrl.origin), { status: 303, headers });
}
