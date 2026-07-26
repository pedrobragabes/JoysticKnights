"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CONSENT_COOKIE_MAX_AGE,
  CONSENT_COOKIE_NAME,
  CONSENT_STORAGE_KEY,
  type ConsentPreferences,
  type OptionalConsentCategory,
  type StoredConsent,
  createStoredConsent,
  getStoredConsentFromCookie,
  parseStoredConsent,
  serializeStoredConsent,
} from "./consent";

type ConsentPanel = "notice" | "preferences" | null;

export type ConsentContextValue = {
  preferences: StoredConsent | null;
  isReady: boolean;
  isBannerOpen: boolean;
  hasConsent: (category: OptionalConsentCategory) => boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (preferences: ConsentPreferences) => void;
  openPreferences: () => void;
};

const fallbackContext: ConsentContextValue = {
  preferences: null,
  isReady: false,
  isBannerOpen: false,
  hasConsent: () => false,
  acceptAll: () => undefined,
  rejectAll: () => undefined,
  savePreferences: () => undefined,
  openPreferences: () => undefined,
};

export const ConsentContext = createContext<ConsentContextValue>(fallbackContext);

function readPersistedConsent() {
  try {
    const localConsent = parseStoredConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
    if (localConsent) return localConsent;
  } catch {
    // Cookies remain available when storage is blocked or unavailable.
  }

  return getStoredConsentFromCookie(document.cookie);
}

function persistConsent(consent: StoredConsent) {
  const serialized = serializeStoredConsent(consent);

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
  } catch {
    // The cookie below is the persistence fallback for restricted browsers.
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(serialized)}; Max-Age=${CONSENT_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

function clearInvalidConsent() {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Storage may be unavailable; expire the cookie regardless.
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

export function useConsent() {
  return useContext(ConsentContext);
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<StoredConsent | null>(null);
  const [panel, setPanel] = useState<ConsentPanel>(null);
  const [isReady, setIsReady] = useState(false);
  const [draft, setDraft] = useState<ConsentPreferences>({ statistics: false, marketing: false });
  const statisticsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readPersistedConsent();
      if (!stored) clearInvalidConsent();
      setPreferences(stored);
      setDraft(stored ?? { statistics: false, marketing: false });
      setPanel(stored ? null : "notice");
      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function syncConsent(event: StorageEvent) {
      if (event.key !== CONSENT_STORAGE_KEY) return;
      const stored = parseStoredConsent(event.newValue);
      setPreferences(stored);
      setDraft(stored ?? { statistics: false, marketing: false });
      setPanel(stored ? null : "notice");
    }

    window.addEventListener("storage", syncConsent);
    return () => window.removeEventListener("storage", syncConsent);
  }, []);

  const savePreferences = useCallback((nextPreferences: ConsentPreferences) => {
    const stored = createStoredConsent(nextPreferences);
    persistConsent(stored);
    setPreferences(stored);
    setDraft(nextPreferences);
    setPanel(null);
  }, []);

  const acceptAll = useCallback(() => {
    savePreferences({ statistics: true, marketing: true });
  }, [savePreferences]);

  const rejectAll = useCallback(() => {
    savePreferences({ statistics: false, marketing: false });
  }, [savePreferences]);

  const openPreferences = useCallback(() => {
    setDraft(preferences ?? { statistics: false, marketing: false });
    setPanel("preferences");
    window.setTimeout(() => statisticsInputRef.current?.focus(), 0);
  }, [preferences]);

  const hasConsent = useCallback(
    (category: OptionalConsentCategory) => Boolean(preferences?.[category]),
    [preferences],
  );

  const value = useMemo<ConsentContextValue>(() => ({
    preferences,
    isReady,
    isBannerOpen: panel !== null,
    hasConsent,
    acceptAll,
    rejectAll,
    savePreferences,
    openPreferences,
  }), [preferences, isReady, panel, hasConsent, acceptAll, rejectAll, savePreferences, openPreferences]);

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {isReady && panel ? (
        <aside
          role="dialog"
          aria-modal="false"
          aria-labelledby="consent-title"
          aria-describedby="consent-description"
          className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-h-[calc(100vh-1.5rem)] max-w-4xl overflow-y-auto rounded-card border border-white/15 bg-[#151219] p-5 text-white shadow-[0_24px_80px_rgb(21_18_25_/_35%)] sm:inset-x-6 sm:bottom-6 sm:p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-lilac">Sua privacidade</p>
              <h2 id="consent-title" className="font-display mt-2 text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">
                Você escolhe como seus dados são usados.
              </h2>
              <p id="consent-description" className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                Cookies essenciais mantêm o site funcionando. Com sua permissão, usamos medição de audiência para melhorar o conteúdo e marketing para financiar a publicação com anúncios.
              </p>

              {panel === "preferences" ? (
                <fieldset className="mt-5 grid gap-3 sm:grid-cols-3">
                  <legend className="sr-only">Categorias de consentimento</legend>
                  <label className="flex min-h-24 items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
                    <input type="checkbox" checked disabled className="mt-1 size-4 accent-lilac" />
                    <span>
                      <span className="block text-sm font-extrabold">Essenciais</span>
                      <span className="mt-1 block text-xs leading-5 text-white/65">Segurança, preferências e funcionamento básico.</span>
                    </span>
                  </label>
                  <label className="flex min-h-24 cursor-pointer items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-4 transition hover:border-lilac">
                    <input
                      ref={statisticsInputRef}
                      type="checkbox"
                      checked={draft.statistics}
                      onChange={(event) => setDraft((current) => ({ ...current, statistics: event.target.checked }))}
                      className="mt-1 size-4 accent-lilac"
                    />
                    <span>
                      <span className="block text-sm font-extrabold">Estatísticas</span>
                      <span className="mt-1 block text-xs leading-5 text-white/65">Mede audiência e uso do site.</span>
                    </span>
                  </label>
                  <label className="flex min-h-24 cursor-pointer items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-4 transition hover:border-lilac">
                    <input
                      type="checkbox"
                      checked={draft.marketing}
                      onChange={(event) => setDraft((current) => ({ ...current, marketing: event.target.checked }))}
                      className="mt-1 size-4 accent-lilac"
                    />
                    <span>
                      <span className="block text-sm font-extrabold">Marketing</span>
                      <span className="mt-1 block text-xs leading-5 text-white/65">Permite anúncios e sua medição.</span>
                    </span>
                  </label>
                </fieldset>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 lg:max-w-80 lg:justify-end">
              {panel === "preferences" ? (
                <button
                  type="button"
                  onClick={() => savePreferences(draft)}
                  className="min-h-11 rounded-full bg-white px-5 text-sm font-black text-[#151219] transition hover:bg-lilac"
                >
                  Salvar preferências
                </button>
              ) : (
                <button
                  type="button"
                  onClick={acceptAll}
                  className="min-h-11 rounded-full bg-white px-5 text-sm font-black text-[#151219] transition hover:bg-lilac"
                >
                  Aceitar todos
                </button>
              )}
              <button
                type="button"
                onClick={rejectAll}
                className="min-h-11 rounded-full border border-white/25 px-5 text-sm font-black text-white transition hover:border-white hover:bg-white/10"
              >
                Recusar opcionais
              </button>
              {panel === "notice" ? (
                <button
                  type="button"
                  aria-expanded="false"
                  onClick={openPreferences}
                  className="min-h-11 rounded-full px-4 text-sm font-black text-lilac underline decoration-lilac/50 underline-offset-4 transition hover:text-white"
                >
                  Personalizar
                </button>
              ) : null}
            </div>
          </div>
        </aside>
      ) : null}
    </ConsentContext.Provider>
  );
}
