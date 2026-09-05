"use client";

import { useEffect, useState } from "react";
import { useConsent } from "./consent-provider";

export function ConsentSettingsButton() {
  const { isReady, openPreferences } = useConsent();
  const [googleReady, setGoogleReady] = useState(false);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT) return;
    let active = true;
    const googleWindow = window as typeof window & {
      googlefc?: { callbackQueue?: Array<Record<string, () => void>>; showRevocationMessage?: () => void };
    };
    googleWindow.googlefc = googleWindow.googlefc || {};
    googleWindow.googlefc.callbackQueue = googleWindow.googlefc.callbackQueue || [];
    googleWindow.googlefc.callbackQueue.push({ CONSENT_API_READY: () => { if (active) setGoogleReady(true); } });
    return () => { active = false; };
  }, []);

  function openGooglePreferences() {
    const googleWindow = window as typeof window & { googlefc?: { showRevocationMessage?: () => void } };
    googleWindow.googlefc?.showRevocationMessage?.();
  }

  return (
    <>
    <button
      type="button"
      disabled={!isReady}
      onClick={openPreferences}
      className="text-left text-sm font-semibold text-muted transition hover:text-brand disabled:cursor-wait disabled:opacity-60"
    >
      Gerenciar cookies
    </button>
    {googleReady ? <button type="button" onClick={openGooglePreferences} className="text-left text-sm font-semibold text-muted hover:text-brand">Privacidade dos anúncios Google</button> : null}
    </>
  );
}
