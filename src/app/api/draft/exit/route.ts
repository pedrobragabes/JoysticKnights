import { cookies, draftMode } from "next/headers";
import { previewCookie } from "@/lib/wordpress/preview";
import { getSiteUrl } from "@/lib/site-config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(getSiteUrl()).origin) return new Response("Origem inválida.", { status: 403 });
  const draft = await draftMode();
  draft.disable();
  (await cookies()).delete(previewCookie);
  return NextResponse.redirect(new URL("/", getSiteUrl()), 303);
}
