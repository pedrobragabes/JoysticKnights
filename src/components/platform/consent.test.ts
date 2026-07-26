import { describe, expect, it } from "vitest";
import {
  CONSENT_COOKIE_NAME,
  CONSENT_VERSION,
  createStoredConsent,
  getStoredConsentFromCookie,
  parseStoredConsent,
  serializeStoredConsent,
} from "./consent";

const updatedAt = "2026-07-26T18:00:00.000Z";

describe("consent persistence", () => {
  it("creates and round-trips the current consent schema", () => {
    const consent = createStoredConsent({ statistics: true, marketing: false }, updatedAt);

    expect(parseStoredConsent(serializeStoredConsent(consent))).toEqual({
      version: CONSENT_VERSION,
      statistics: true,
      marketing: false,
      updatedAt,
    });
  });

  it("rejects stale or malformed records", () => {
    expect(parseStoredConsent(JSON.stringify({
      version: CONSENT_VERSION + 1,
      statistics: true,
      marketing: true,
      updatedAt,
    }))).toBeNull();
    expect(parseStoredConsent(JSON.stringify({
      version: CONSENT_VERSION,
      statistics: "yes",
      marketing: false,
      updatedAt,
    }))).toBeNull();
    expect(parseStoredConsent("not-json")).toBeNull();
  });

  it("reads the encoded fallback cookie among unrelated cookies", () => {
    const consent = createStoredConsent({ statistics: false, marketing: true }, updatedAt);
    const cookie = `session=abc; ${CONSENT_COOKIE_NAME}=${encodeURIComponent(serializeStoredConsent(consent))}; theme=dark`;

    expect(getStoredConsentFromCookie(cookie)).toEqual(consent);
  });
});
