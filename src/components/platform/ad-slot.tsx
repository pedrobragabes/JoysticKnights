"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { useConsent } from "./consent-provider";

type AdFormat = "leaderboard" | "billboard" | "rectangle";

function normalizeAdsenseClient(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && /^ca-pub-\d+$/.test(normalized) ? normalized : null;
}

function normalizeAdsenseSlot(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && /^\d+$/.test(normalized) ? normalized : null;
}

export function AdSenseAutoAds() {
  const { hasConsent, isReady } = useConsent();
  const client = normalizeAdsenseClient(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
  if (!client || !isReady || !hasConsent("marketing")) return null;

  return (
    <Script
      id="google-adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}

export function AdSlot({
  name,
  format = "leaderboard",
  slot,
}: {
  name: string;
  format?: AdFormat;
  slot?: string;
}) {
  const { hasConsent, isReady } = useConsent();
  const requestedRef = useRef<string | null>(null);
  const client = normalizeAdsenseClient(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
  const normalizedSlot = normalizeAdsenseSlot(slot);
  const isConfigured = Boolean(client && normalizedSlot);
  const canRequestAd = isReady && hasConsent("marketing") && isConfigured;
  const requestKey = client && normalizedSlot ? `${client}:${normalizedSlot}` : null;

  useEffect(() => {
    if (!canRequestAd || !requestKey) {
      requestedRef.current = null;
      return;
    }
    if (requestedRef.current === requestKey) return;

    const adsWindow = window as typeof window & { adsbygoogle?: Array<Record<string, never>> };
    adsWindow.adsbygoogle = adsWindow.adsbygoogle ?? [];
    adsWindow.adsbygoogle.push({});
    requestedRef.current = requestKey;
  }, [canRequestAd, requestKey]);

  return (
    <aside
      className={`ad-slot ad-slot--${format} relative`}
      aria-label="Publicidade"
      data-ad-slot={name}
      data-ad-format={format}
      data-ad-status={canRequestAd ? "requested" : isConfigured ? "awaiting-consent" : "unconfigured"}
    >
      {canRequestAd && client && normalizedSlot ? (
        <>
          <span className="pointer-events-none absolute left-2 top-1 text-[0.55rem] opacity-60">Publicidade</span>
          <ins
            key={requestKey}
            className="adsbygoogle block min-h-full w-full"
            style={{ display: "block" }}
            data-ad-client={client}
            data-ad-slot={normalizedSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </>
      ) : (
        <span>Publicidade</span>
      )}
    </aside>
  );
}
