"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useConsent } from "./consent-provider";

type GoogleConsentValue = "granted" | "denied";

function normalizeGoogleTagId(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && /^(G|GT|GTM|AW|DC)-[A-Z0-9-]+$/i.test(normalized) ? normalized : null;
}

function getGoogleConsentState(statistics: boolean, marketing: boolean) {
  const adConsent: GoogleConsentValue = marketing ? "granted" : "denied";
  return {
    analytics_storage: statistics ? "granted" as const : "denied" as const,
    ad_storage: adConsent,
    ad_user_data: adConsent,
    ad_personalization: adConsent,
    functionality_storage: "granted" as const,
    security_storage: "granted" as const,
  };
}

function safeInlineJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function Analytics() {
  const { hasConsent, isReady } = useConsent();
  const statistics = isReady && hasConsent("statistics");
  const marketing = isReady && hasConsent("marketing");
  const tagId = [
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID,
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  ].map(normalizeGoogleTagId).find((value) => value !== null) ?? null;
  const isTagManager = tagId?.startsWith("GTM-") ?? false;

  useEffect(() => {
    if (!isReady) return;

    const consentState = getGoogleConsentState(statistics, marketing);
    const googleWindow = window as typeof window & {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: unknown[];
    };
    googleWindow.gtag?.("consent", "update", consentState);
    googleWindow.dataLayer?.push({
      event: "consent_update",
      consent_statistics: statistics,
      consent_marketing: marketing,
    });
  }, [isReady, marketing, statistics]);

  if (!tagId || !statistics) return null;

  const consentState = getGoogleConsentState(statistics, marketing);
  const bootstrap = `
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
    window.gtag('consent', 'default', ${safeInlineJson(consentState)});
    ${isTagManager
      ? "window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});"
      : `window.gtag('js', new Date()); window.gtag('config', ${safeInlineJson(tagId)}, { anonymize_ip: true });`}
  `;

  return (
    <>
      <Script id="google-consent-bootstrap" strategy="afterInteractive">{bootstrap}</Script>
      <Script
        id={isTagManager ? "google-tag-manager" : "google-tag"}
        src={isTagManager
          ? `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(tagId)}`
          : `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`}
        strategy="afterInteractive"
      />
    </>
  );
}
