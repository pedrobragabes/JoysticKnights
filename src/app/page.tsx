import type { Metadata } from "next";
import { EditorialHome } from "@/components/editorial/editorial-home";
import { parsePage } from "@/lib/pagination";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  return {
    title: page > 1 ? `Últimas notícias — Página ${page}` : { absolute: `${siteConfig.name} — notícias, análises e cultura gamer` },
    alternates: { canonical: page > 1 ? `/page/${page}/` : "/" },
  };
}

export default async function Home({ searchParams }: PageProps<"/">) {
  return <EditorialHome page={parsePage((await searchParams).page)} />;
}
