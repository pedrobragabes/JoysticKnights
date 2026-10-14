import sanitizeHtml from "sanitize-html";
import { getSiteUrl, siteConfig } from "../site-config";
import { decodeHtmlEntities, plainText, slugifyHeading, stripEditorialMarkers } from "../wordpress/text";

export type ArticleHeading = {
  id: string;
  label: string;
  level: 2 | 3;
};

function sanitize(html: string) {
  html = stripEditorialMarkers(html);
  // Spectra paints rating stars with SVG. Preserve the saved numeric score
  // without trusting its legacy structured data or executing plugin scripts.
  html = html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, (_match, json: string) => {
    try {
      const review = JSON.parse(json);
      const rating = review?.["@type"] === "Review" ? review.reviewRating : null;
      const value = Number(rating?.ratingValue);
      const maximum = Number(rating?.bestRating ?? 5);
      if (rating && Number.isFinite(value) && Number.isFinite(maximum) && maximum > 0 && value >= 0 && value <= maximum) {
        return `<p class="editorial-legacy-rating"><strong>Nota: ${value} / ${maximum}</strong></p>`;
      }
    } catch { /* Malformed plugin data is discarded with other scripts. */ }
    return "";
  });
  const internalHosts = new Set<string>();
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
      "audio",
      "details",
      "summary",
    ]),
    allowedAttributes: {
      "*": ["class", "id", "role", "aria-*", "data-*"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "srcset", "sizes", "alt", "title", "width", "height", "loading", "decoding"],
      iframe: ["src", "title", "width", "height", "allow", "allowfullscreen", "loading"],
      video: ["src", "controls", "poster", "preload", "width", "height"],
      source: ["src", "srcset", "type", "media"],
      audio: ["src", "controls", "preload"],
      details: ["open"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com", "open.spotify.com", "w.soundcloud.com", "store.steampowered.com"],
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

        safeAttributes.loading = attribs.loading ?? "lazy";
        safeAttributes.decoding = "async";
        return { tagName, attribs: safeAttributes };
      },
      iframe: (tagName, attribs) => {
        let src = attribs.src ?? "";
        try {
          const url = new URL(src);
          if (["youtube.com", "www.youtube.com"].includes(url.hostname)) {
            url.hostname = "www.youtube-nocookie.com";
            src = url.href;
          }
        } catch { src = ""; }
        return { tagName, attribs: { ...attribs, src, title: attribs.title || "Conteúdo incorporado", loading: "lazy" } };
      },
    },
  });
}

export function prepareArticleContent(html: string) {
  const sanitized = sanitize(html);
  // Reserve existing anchors before generating any IDs, including IDs outside
  // headings. Keep the first occurrence of a valid saved heading anchor.
  const existingIds = new Map<string, number>();
  const validId = (id: string) => id.length > 0 && !/[\s\u0000-\u001f]/.test(id);
  for (const match of sanitized.matchAll(/<[a-z][^>]*\sid="([^"]*)"[^>]*>/gi)) {
    const id = decodeHtmlEntities(match[1]);
    if (validId(id) && !existingIds.has(id)) existingIds.set(id, match.index);
  }
  const usedIds = new Set(existingIds.keys());
  const headings: ArticleHeading[] = [];
  const safeHtml = sanitized.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, rawLevel: string, rawAttributes: string, innerHtml: string, offset: number) => {
      const label = plainText(innerHtml);
      if (!label) return match;

      const savedId = decodeHtmlEntities(rawAttributes.match(/\sid="([^"]*)"/i)?.[1] ?? "");
      const preserveId = validId(savedId) && existingIds.get(savedId) === offset;
      const baseId = slugifyHeading(label);
      let id = preserveId ? savedId : baseId;
      for (let suffix = 2; !preserveId && usedIds.has(id); suffix += 1) id = `${baseId}-${suffix}`;
      usedIds.add(id);
      const level = Number(rawLevel) as 2 | 3;
      headings.push({ id, label, level });
      if (preserveId) return match;

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
