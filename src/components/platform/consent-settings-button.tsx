"use client";

import { useConsent } from "./consent-provider";

export function ConsentSettingsButton() {
  const { isReady, openPreferences } = useConsent();

  return (
    <button
      type="button"
      disabled={!isReady}
      onClick={openPreferences}
      className="text-left text-sm font-semibold text-muted transition hover:text-brand disabled:cursor-wait disabled:opacity-60"
    >
      Gerenciar cookies
    </button>
  );
}
