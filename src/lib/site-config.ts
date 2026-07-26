export type SiteProfile = "promogames" | "joysticknights";

type NavigationCategory = {
  slug: string;
  label: string;
  icon: "playstation" | "xbox" | "nintendo" | "pc" | "news" | "anime" | "review" | "guide" | "deal";
};

type SiteConfig = {
  profile: SiteProfile;
  name: string;
  brandLines: [string, string];
  brandMark: string;
  defaultSiteUrl: string;
  defaultWordPressApiUrl: string;
  description: string;
  shortDescription: string;
  newsroomLabel: string;
  contactEmail: string;
  twitterHandle?: string;
  social: {
    x?: string;
    instagram?: string;
  };
  navigationCategories: NavigationCategory[];
  featuredChannelSlugs: string[];
  theme: {
    brand: string;
    brandStrong: string;
    accent: string;
    lilac: string;
    deals: string;
  };
};

const profiles: Record<SiteProfile, SiteConfig> = {
  promogames: {
    profile: "promogames",
    name: "PromoGames",
    brandLines: ["Promo", "Games"],
    brandMark: "P",
    defaultSiteUrl: "https://promogamesbr.com",
    defaultWordPressApiUrl: "https://promogamesbr.com/wp-json/wp/v2",
    description: "Notícias, análises, guias e promoções para quem vive PlayStation, Xbox, Nintendo e PC.",
    shortDescription: "Notícias, análises e promoções para quem vive videogames.",
    newsroomLabel: "Redação PromoGames",
    contactEmail: "contato@promogamesbr.com",
    twitterHandle: "@PromoGamesBR",
    social: {},
    navigationCategories: [
      { slug: "playstation", label: "PlayStation", icon: "playstation" },
      { slug: "xbox", label: "Xbox", icon: "xbox" },
      { slug: "nintendo", label: "Nintendo", icon: "nintendo" },
      { slug: "pc", label: "PC", icon: "pc" },
      { slug: "analise", label: "Análises", icon: "review" },
      { slug: "guias", label: "Guias", icon: "guide" },
      { slug: "promocao", label: "Promoções", icon: "deal" },
    ],
    featuredChannelSlugs: ["playstation", "xbox", "nintendo", "pc"],
    theme: {
      brand: "#6426d9",
      brandStrong: "#4b16b4",
      accent: "#f02f7d",
      lilac: "#cbb7ff",
      deals: "#ffb000",
    },
  },
  joysticknights: {
    profile: "joysticknights",
    name: "JoystickNights",
    brandLines: ["Joystick", "Nights"],
    brandMark: "J",
    defaultSiteUrl: "https://joysticknights.com.br",
    defaultWordPressApiUrl: "https://joysticknights.com.br/wp-json/wp/v2",
    description: "Notícias, análises e cultura gamer para quem joga no PlayStation, Xbox, Nintendo e PC.",
    shortDescription: "Notícias, análises e cultura gamer para quem joga até tarde.",
    newsroomLabel: "Redação JoystickNights",
    contactEmail: "contact@joysticknights.com.br",
    twitterHandle: "@errinhopog",
    social: {
      x: "https://x.com/JoysticKnights",
      instagram: "https://www.instagram.com/joysticknights_/",
    },
    navigationCategories: [
      { slug: "noticias", label: "Notícias", icon: "news" },
      { slug: "analises", label: "Análises", icon: "review" },
      { slug: "anime", label: "Anime", icon: "anime" },
      { slug: "playstation", label: "PlayStation", icon: "playstation" },
      { slug: "xbox", label: "Xbox", icon: "xbox" },
      { slug: "nintendo", label: "Nintendo", icon: "nintendo" },
      { slug: "pc", label: "PC", icon: "pc" },
    ],
    featuredChannelSlugs: ["playstation", "xbox", "nintendo", "pc"],
    theme: {
      brand: "#5b35f2",
      brandStrong: "#4020c7",
      accent: "#ff365f",
      lilac: "#c9bcff",
      deals: "#ffbd2e",
    },
  },
};

function resolveProfile(value: string | undefined): SiteProfile {
  return value === "promogames" ? "promogames" : "joysticknights";
}

export const siteConfig = profiles[resolveProfile(process.env.NEXT_PUBLIC_SITE_PROFILE)];

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.defaultSiteUrl).replace(/\/$/, "");
}

export function getCategoryHref(slug: string) {
  if (siteConfig.profile === "joysticknights") {
    const parent = siteConfig.featuredChannelSlugs.includes(slug) || slug === "mobile" ? "/plataformas" : "";
    return `/category${parent}/${slug}/`;
  }
  return `/categoria/${slug}/`;
}
