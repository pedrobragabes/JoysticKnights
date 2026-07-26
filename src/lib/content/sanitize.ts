import sanitizeHtml from "sanitize-html";
import { getSiteUrl, siteConfig } from "../site-config";
import { plainText, slugifyHeading } from "../wordpress/text";

export type ArticleHeading = {
  id: string;
  label: string;
  level: 2 | 3;
};

type PrepareArticleOptions = {
  featuredImageUrl?: string;
};

function imageKey(value: string | undefined) {
  if (!value || value.startsWith("data:image/")) return "";
  try {
    const url = new URL(value, "https://wordpress.invalid");
    return decodeURIComponent(url.pathname)
      .replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, "")
      .replace(/-scaled(?=\.[a-z0-9]+$)/i, "")
      .toLowerCase();
  } catch {
    return value.split(/[?#]/, 1)[0].toLowerCase();
  }
}

function sanitize(html: string, options: PrepareArticleOptions = {}) {
  const internalHosts = new Set<string>();
  const seenImages = new Set<string>();
  const featuredImageKey = imageKey(options.featuredImageUrl);
  if (featuredImageKey) seenImages.add(featuredImageKey);
  for (const value of [getSiteUrl(), siteConfig.defaultSiteUrl, process.env.WORDPRESS_API_URL ?? siteConfig.defaultWordPressApiUrl]) {
    try {
      internalHosts.add(new URL(value).hostname.replace(/^www\./, ""));
    } catch {
      // Invalid deployment configuration is handled by the data client.
    }
  }

  function rewriteInternalHref(href: string | undefined) {
    if (!href || href.startsWith("/") || href.startsWith("#")) return href;
    try {
      const url = new URL(href);
      if (!internalHosts.has(url.hostname.replace(/^www\./, ""))) return href;
      if (/^\/(?:wp-content|wp-admin)\//.test(url.pathname) || url.pathname === "/wp-login.php") return href;
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return href;
    }
  }

  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "figure",
      "figcaption",
      "img",
      "iframe",
      "video",
      "source",
      "picture",
    ]),
    allowedAttributes: {
      "*": ["class", "id", "role", "aria-*", "data-*"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "srcset", "sizes", "alt", "title", "width", "height", "loading", "decoding"],
      iframe: ["src", "title", "width", "height", "allow", "allowfullscreen", "loading"],
      video: ["src", "controls", "poster", "preload", "width", "height"],
      source: ["src", "srcset", "type", "media"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "player.vimeo.com"],
    transformTags: {
      a: (tagName, attribs) => {
        const safeAttributes: Record<string, string> = { ...attribs };
        const href = rewriteInternalHref(attribs.href);
        if (href) safeAttributes.href = href;
        else delete safeAttributes.href;
        if (attribs.target === "_blank") safeAttributes.rel = "noopener noreferrer";
        return { tagName, attribs: safeAttributes };
      },
      img: (tagName, attribs) => {
        const safeAttributes = { ...attribs };
        const lazySrc = attribs["data-src"] ?? attribs["data-lazy-src"];
        const lazySrcset = attribs["data-srcset"] ?? attribs["data-lazy-srcset"];
        const hasPlaceholder = !attribs.src || attribs.src.startsWith("data:image/");

        if (lazySrc && hasPlaceholder) safeAttributes.src = lazySrc;
        if (lazySrcset && !attribs.srcset) safeAttributes.srcset = lazySrcset;

        const key = imageKey(safeAttributes.src);
        if (key && seenImages.has(key)) {
          return { tagName: "span", attribs: { "data-duplicate-image": "true" } };
        }
        if (key) seenImages.add(key);

        safeAttributes.loading = attribs.loading ?? "lazy";
        safeAttributes.decoding = "async";
        return { tagName, attribs: safeAttributes };
      },
      iframe: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy" },
      }),
    },
  }).replace(/<span data-duplicate-image="true"><\/span>/g, "");
}

export function prepareArticleContent(html: string, options: PrepareArticleOptions = {}) {
  const usedIds = new Map<string, number>();
  const headings: ArticleHeading[] = [];
  const safeHtml = sanitize(html, options).replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, rawLevel: string, rawAttributes: string, innerHtml: string) => {
      const label = plainText(innerHtml);
      if (!label) return match;

      const baseId = slugifyHeading(label);
      const occurrence = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, occurrence + 1);
      const id = occurrence ? `${baseId}-${occurrence + 1}` : baseId;
      const level = Number(rawLevel) as 2 | 3;
      headings.push({ id, label, level });

      const attributes = rawAttributes.replace(/\s+id=("[^"]*"|'[^']*')/gi, "");
      return `<h${level}${attributes} id="${id}">${innerHtml}</h${level}>`;
    },
  );

  return { html: safeHtml, headings };
}

export function sanitizeArticleHtml(html: string) {
  return prepareArticleContent(html).html;
}

export function sanitizeCommentHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "a", "strong", "em", "b", "i", "code", "pre", "blockquote", "ul", "ol", "li"],
    allowedAttributes: { a: ["href", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName, attribs) => {
        const safeAttributes: Record<string, string> = {
          rel: "nofollow ugc noopener noreferrer",
        };
        if (attribs.href) safeAttributes.href = attribs.href;
        return { tagName, attribs: safeAttributes };
      },
    },
  });
}
