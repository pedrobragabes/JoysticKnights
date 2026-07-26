export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  const publisher = /^ca-(pub-\d+)$/.exec(client ?? "")?.[1];
  const body = publisher ? `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n` : "";

  return new Response(body, {
    status: publisher ? 200 : 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
