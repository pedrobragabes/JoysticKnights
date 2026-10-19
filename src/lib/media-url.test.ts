import { afterEach, expect, it, vi } from "vitest";
import { isConfiguredMediaUrl } from "./media-url";
afterEach(() => vi.unstubAllEnvs());
it("keeps production media restricted to HTTPS in the configured CMS", () => {
  vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("WORDPRESS_MEDIA_ORIGIN", "https://cms.example.test");
  expect(isConfiguredMediaUrl(new URL("https://cms.example.test/wp-content/uploads/image.png"))).toBe(true);
  for (const url of ["http://cms.example.test/wp-content/uploads/image.png", "https://evil.test/wp-content/uploads/image.png", "https://user@cms.example.test/wp-content/uploads/image.png", "https://cms.example.test/wp-admin/image.png"]) expect(isConfiguredMediaUrl(new URL(url))).toBe(false);
});
it("permits only the exact configured loopback media origin in local dev", () => {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:3216"); vi.stubEnv("WORDPRESS_MEDIA_ORIGIN", "http://127.0.0.1:3215");
  expect(isConfiguredMediaUrl(new URL("http://127.0.0.1:3215/wp-content/uploads/image.png"))).toBe(true);
  for (const url of ["http://127.0.0.1:3211/wp-content/uploads/image.png", "http://localhost:3215/wp-content/uploads/image.png", "http://127.0.0.1:3215/wp-content/uploads/image.png?path=private"]) expect(isConfiguredMediaUrl(new URL(url))).toBe(false);
  vi.stubEnv("NODE_ENV", "production");
  expect(isConfiguredMediaUrl(new URL("http://127.0.0.1:3215/wp-content/uploads/image.png"))).toBe(false);
});
