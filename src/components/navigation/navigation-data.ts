import type { IconName } from "@/components/icons";
import { getCategoryHref, siteConfig } from "@/lib/site-config";

export const navigationLinks: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "Início", icon: "home" },
  ...siteConfig.navigationCategories.map((category) => ({
    href: getCategoryHref(category.slug),
    label: category.label,
    icon: category.icon,
  })),
];
