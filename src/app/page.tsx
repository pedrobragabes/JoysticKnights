import type { Metadata } from "next";
import { EditorialHome } from "@/components/editorial/editorial-home";
import { parsePage } from "@/lib/pagination";
import { getPublicSiteSettings } from "@/lib/wordpress/site-settings";

export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  const settings = await getPublicSiteSettings();
  return {
    title: page > 1 ? `Últimas notícias — Página ${page}` : { absolute: settings.homeTitle },
    description: settings.description,
    openGraph: { title: settings.homeTitle, description: settings.description, ...(settings.socialImage ? { images: [{ url: settings.socialImage.src, width: settings.socialImage.width, height: settings.socialImage.height, alt: settings.socialImage.alt }] } : {}) },
    twitter: { card: "summary_large_image", title: settings.homeTitle, description: settings.description, ...(settings.socialImage ? { images: [settings.socialImage.src] } : {}) },
    alternates: { canonical: page > 1 ? `/page/${page}/` : "/" },
  };
}

export default async function Home({ searchParams }: PageProps<"/">) {
  return <EditorialHome page={parsePage((await searchParams).page)} />;
}
