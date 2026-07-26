import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { SiteShell } from "@/components/navigation/site-shell";
import { Analytics } from "@/components/platform/analytics";
import { AdSenseAutoAds } from "@/components/platform/ad-slot";
import { ConsentProvider } from "@/components/platform/consent-provider";
import { getSiteUrl, siteConfig } from "@/lib/site-config";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Bricolage_Grotesque({
  variable: "--font-display-family",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();
const indexingEnabled = process.env.NEXT_PUBLIC_INDEXING_ENABLED !== "false";
const themeBootScript = `try{document.documentElement.dataset.theme=localStorage.getItem("joysticknights-theme")==="light"?"light":"dark"}catch{document.documentElement.dataset.theme="dark"}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} — notícias, análises e cultura gamer`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  creator: siteConfig.name,
  publisher: siteConfig.name,
  icons: siteConfig.profile === "joysticknights"
    ? { icon: "/joysticknights-icon.png", apple: "/joysticknights-icon.png" }
    : { icon: "/favicon.ico" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — notícias, análises e cultura gamer`,
    description: siteConfig.shortDescription,
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${siteConfig.name} — notícias, análises e cultura gamer` }],
  },
  twitter: { card: "summary_large_image", site: siteConfig.twitterHandle, images: ["/og.png"] },
  robots: {
    index: indexingEnabled,
    follow: indexingEnabled,
    googleBot: { index: indexingEnabled, follow: indexingEnabled, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable}`}
      style={{
        "--brand": siteConfig.theme.brand,
        "--brand-strong": siteConfig.theme.brandStrong,
        "--accent": siteConfig.theme.accent,
        "--lilac": siteConfig.theme.lilac,
        "--deals": siteConfig.theme.deals,
      } as CSSProperties}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <ConsentProvider>
          <a className="skip-link" href="#conteudo">
            Pular para o conteúdo
          </a>
          <SiteShell>
            <main id="conteudo">{children}</main>
          </SiteShell>
          <Analytics />
          <AdSenseAutoAds />
        </ConsentProvider>
      </body>
    </html>
  );
}
