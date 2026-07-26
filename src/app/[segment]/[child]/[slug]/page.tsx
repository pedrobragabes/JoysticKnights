import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryArticle } from "@/components/editorial/story-article";
import { getHrefSegments } from "@/lib/wordpress/mappers";
import { getStoryMetadata } from "@/lib/wordpress/metadata";
import { getStories, getStoryBySlug } from "@/lib/wordpress/queries";
import type { Story } from "@/lib/wordpress/types";

function matchesNestedPermalink(story: Story, parent: string, category: string, slug: string) {
  const segments = getHrefSegments(story.href);
  return segments.length === 3
    && segments[0] === parent
    && segments[1] === category
    && segments[2] === slug;
}

export async function generateStaticParams() {
  const { items } = await getStories({ perPage: 24 });
  return items.flatMap((story) => {
    const segments = getHrefSegments(story.href);
    return segments.length === 3
      ? [{ segment: segments[0], child: segments[1], slug: segments[2] }]
      : [];
  });
}

export async function generateMetadata({ params }: PageProps<"/[segment]/[child]/[slug]">): Promise<Metadata> {
  const { segment: parent, child: category, slug } = await params;
  const story = await getStoryBySlug(slug);
  return story && matchesNestedPermalink(story, parent, category, slug) ? getStoryMetadata(story) : {};
}

export default async function NestedStoryPage({ params }: PageProps<"/[segment]/[child]/[slug]">) {
  const { segment: parent, child: category, slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story || !matchesNestedPermalink(story, parent, category, slug)) notFound();
  return <StoryArticle story={story} />;
}
