import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryArticle } from "@/components/editorial/story-article";
import { getHrefSegments } from "@/lib/wordpress/mappers";
import { getStoryMetadata } from "@/lib/wordpress/metadata";
import { getStories, getStoryBySlug } from "@/lib/wordpress/queries";
import type { Story } from "@/lib/wordpress/types";

function matchesLegacyPermalink(story: Story, category: string, slug: string) {
  const segments = getHrefSegments(story.href);
  return segments.length === 2 && segments[0] === category && segments[1] === slug;
}

export async function generateStaticParams() {
  const { items } = await getStories({ perPage: 24 });
  return items.flatMap((story) => {
    const segments = getHrefSegments(story.href);
    return segments.length === 2
      ? [{ segment: segments[0], child: segments[1] }]
      : [];
  });
}

export async function generateMetadata({ params }: PageProps<"/[segment]/[child]">): Promise<Metadata> {
  const { segment: category, child: slug } = await params;
  const story = await getStoryBySlug(slug);
  return story && matchesLegacyPermalink(story, category, slug) ? getStoryMetadata(story) : {};
}

export default async function LegacyStoryPage({ params }: PageProps<"/[segment]/[child]">) {
  const { segment: category, child: slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story || !matchesLegacyPermalink(story, category, slug)) notFound();
  return <StoryArticle story={story} />;
}
