import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { safeSecretEqual } from "@/lib/security";
import { getPreviewStoryById } from "@/lib/wordpress/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = Number.parseInt(url.searchParams.get("id") ?? "", 10);
  const secret = url.searchParams.get("secret");

  if (!safeSecretEqual(secret, process.env.DRAFT_MODE_SECRET) || !Number.isInteger(id) || id < 1) {
    return Response.json({ error: "Preview não autorizado." }, { status: 401 });
  }

  const story = await getPreviewStoryById(id);
  if (!story) return Response.json({ error: "Rascunho não encontrado." }, { status: 404 });

  const draft = await draftMode();
  draft.enable();
  redirect(`/preview/${story.id}/`);
}
