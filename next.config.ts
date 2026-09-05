import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const siteProfile = process.env.NEXT_PUBLIC_SITE_PROFILE === "promogames" ? "promogames" : "joysticknights";
const defaultSiteUrl = siteProfile === "joysticknights" ? "https://joysticknights.com.br" : "https://promogamesbr.com";
const defaultWordPressApiUrl = siteProfile === "joysticknights" ? "https://cms.joysticknights.com.br/wp-json/wp/v2" : `${defaultSiteUrl}/wp-json/wp/v2`;
const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl).origin;
const wordpressOrigin = new URL(process.env.WORDPRESS_API_URL ?? defaultWordPressApiUrl).origin;
const newsletterOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_NEWSLETTER_ACTION
      ? new URL(process.env.NEXT_PUBLIC_NEWSLETTER_ACTION).origin
      : "";
  } catch {
    return "";
  }
})();
const usesSeparateWordPressOrigin = wordpressOrigin !== siteOrigin;
const mediaHosts = Array.from(new Set([
  new URL(siteOrigin).hostname,
  new URL(wordpressOrigin).hostname,
  "joysticknights.com.br",
  "www.joysticknights.com.br",
  "cms.joysticknights.com.br",
]));
const mediaOrigins = mediaHosts.map((hostname) => `https://${hostname}`).join(" ");
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${mediaOrigins} https://secure.gravatar.com https://www.google-analytics.com https://*.googleusercontent.com https://*.googlesyndication.com https://*.doubleclick.net`,
  "font-src 'self' data:",
  `connect-src 'self'${isDevelopment ? " ws: wss:" : ""} ${siteOrigin} ${wordpressOrigin} https://www.google-analytics.com https://region1.google-analytics.com https://*.googlesyndication.com https://*.doubleclick.net`,
  "frame-src 'self' https://www.youtube.com https://youtube.com https://player.vimeo.com https://*.googlesyndication.com https://*.doubleclick.net",
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self'${newsletterOrigin ? ` ${newsletterOrigin}` : ""}`,
  "frame-ancestors 'self'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: true,
  experimental: {
    cpus: 2,
    // The shared WordPress host has a tight resource ceiling. Keep static
    // generation from creating a burst of parallel REST requests during CI.
    staticGenerationRetryCount: 2,
    staticGenerationMaxConcurrency: 2,
    staticGenerationMinPagesPerWorker: 100,
  },
  images: {
    remotePatterns: [
      ...mediaHosts.map((hostname) => ({
        protocol: "https" as const,
        hostname,
        pathname: "/wp-content/uploads/**",
      })),
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        pathname: "/avatar/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: `www.${new URL(siteOrigin).hostname}` }], destination: `${siteOrigin}/:path*`, permanent: true },
      { source: "/inicio", destination: "/", permanent: true },
      { source: "/postagens", destination: "/", permanent: true },
      { source: "/pesquisar", destination: "/buscar/", permanent: true },
      ...(usesSeparateWordPressOrigin
        ? [
            { source: "/wp-admin", destination: `${wordpressOrigin}/wp-admin/`, permanent: false },
            { source: "/wp-admin/:path*", destination: `${wordpressOrigin}/wp-admin/:path*`, permanent: false },
            { source: "/wp-login.php", destination: `${wordpressOrigin}/wp-login.php`, permanent: false },
          ]
        : []),
    ];
  },
  async rewrites() {
    return { beforeFiles: [
      { source: "/page/:page(\\d+)", destination: "/?page=:page" },
      { source: "/:section(category|categoria|tag|author|autor)/:path+/page/:page(\\d+)", destination: "/:section/:path*/?page=:page" },
      { source: "/:section(noticias|analises|guias|playstation|xbox|nintendo|pc)/page/:page(\\d+)", destination: "/:section/?page=:page" },
    ], afterFiles: usesSeparateWordPressOrigin ? [
      { source: "/wp-content/:path*", destination: `${wordpressOrigin}/wp-content/:path*` },
      { source: "/wp-includes/:path*", destination: `${wordpressOrigin}/wp-includes/:path*` },
      { source: "/wp-json/:path*", destination: `${wordpressOrigin}/wp-json/:path*` },
    ] : [], fallback: [] };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          ...(isDevelopment ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]),
        ],
      },
      {
        // Hostinger's edge cache cannot be purged by Next.js revalidateTag/revalidatePath.
        // Keep Next's data cache, but make editorial HTML/RSC bypass the external CDN.
        source: "/((?!api|_next/static|_next/image|wp-json|wp-content|wp-includes|feed|ads\\.txt|robots\\.txt|sitemap\\.xml|favicon\\.ico).*)",
        headers: [
          { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
