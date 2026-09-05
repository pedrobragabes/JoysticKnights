import { getStories } from "@/lib/wordpress/queries";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const headers = { "X-Robots-Tag": "noindex", "Cache-Control": "public, max-age=60, s-maxage=300" };
  if (q.length < 3 || q.length > 100) return Response.json({ titles: [] }, { headers });
  try {
    const result = await getStories({ search: q, perPage: 5 });
    return Response.json({ titles: [...new Set(result.items.map((story) => story.title))] }, { headers });
  } catch {
    return Response.json({ titles: [] }, { status: 503, headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
  }
}
