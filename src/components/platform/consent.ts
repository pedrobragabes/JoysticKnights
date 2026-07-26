export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = "editorial-site-consent";
export const CONSENT_COOKIE_NAME = "editorial_site_consent";
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

export type OptionalConsentCategory = "statistics" | "marketing";

export type ConsentPreferences = {
  statistics: boolean;
  marketing: boolean;
};

export type StoredConsent = ConsentPreferences & {
  version: number;
  updatedAt: string;
};

export function createStoredConsent(
  preferences: ConsentPreferences,
  updatedAt = new Date().toISOString(),
): StoredConsent {
  return {
    version: CONSENT_VERSION,
    statistics: preferences.statistics,
    marketing: preferences.marketing,
    updatedAt,
  };
}

export function serializeStoredConsent(consent: StoredConsent) {
  return JSON.stringify(consent);
}

export function parseStoredConsent(value: string | null | undefined): StoredConsent | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StoredConsent>;
    if (
      parsed.version !== CONSENT_VERSION
      || typeof parsed.statistics !== "boolean"
      || typeof parsed.marketing !== "boolean"
      || typeof parsed.updatedAt !== "string"
      || Number.isNaN(Date.parse(parsed.updatedAt))
    ) {
      return null;
    }

    return {
      version: CONSENT_VERSION,
      statistics: parsed.statistics,
      marketing: parsed.marketing,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function getStoredConsentFromCookie(cookieString: string) {
  const prefix = `${CONSENT_COOKIE_NAME}=`;
  const rawValue = cookieString
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);

  if (!rawValue) return null;

  try {
    return parseStoredConsent(decodeURIComponent(rawValue));
  } catch {
    return null;
  }
}
