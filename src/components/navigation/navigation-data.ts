import type { IconName } from "@/components/icons";
import { getCategoryHref, siteConfig } from "@/lib/site-config";

export type NavigationLink = { href: string; label: string; icon: IconName };
export type NavigationGroup = { label: string; links: NavigationLink[] };

const categories = siteConfig.navigationCategories.map((category) => ({
  href: getCategoryHref(category.slug), label: category.label, icon: category.icon,
  platform: siteConfig.featuredChannelSlugs.includes(category.slug),
}));

export const navigationGroups: NavigationGroup[] = [
  { label: "Conteúdo", links: [{ href: "/", label: "Início", icon: "home" }, ...categories.filter((category) => !category.platform)] },
  { label: "Plataformas", links: categories.filter((category) => category.platform) },
  { label: "Equipe", links: [{ href: "/contato/", label: "Contato", icon: "guide" }] },
];
