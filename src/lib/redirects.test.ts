import { expect, it } from "vitest";
import { validRedirectDestination } from "./redirects";
it("allows only internal editorial redirects, including encoded Portuguese slugs", () => {
  for (const path of ["/", "/noticias/materia/", "/a%C3%A7%C3%A3o/"]) expect(validRedirectDestination(path)).toBe(true);
  for (const path of ["https://evil.test/", "//evil.test/", "/api/draft/", "/%61pi/draft/", "/wp-admin/", "/%2f%2fevil/", "/%2e%2e/", "/a%0ab/", "/a?next=evil", "/a#hash"]) expect(validRedirectDestination(path)).toBe(false);
});
