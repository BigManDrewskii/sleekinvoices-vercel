import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

const CONSENT_STORAGE_KEY = "sleek_cookie_consent";
const CONSENT_VERSION = 1;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export interface ConsentPreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface StoredConsent {
  version: number;
  timestamp: number;
  preferences: ConsentPreferences;
  source: "banner" | "settings";
}

interface CookieConsentContextValue {
  hasConsent: boolean;
  preferences: ConsentPreferences;
  showBanner: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  setPreferences: (prefs: Partial<ConsentPreferences>) => void;
  resetConsent: () => void;
  closeBanner: () => void;
}

const defaultPreferences: ConsentPreferences = {
  essential: true,
  functional: true,
  analytics: false,
  marketing: false,
};

const CookieConsentContext = createContext<
  CookieConsentContextValue | undefined
>(undefined);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [hasConsent, setHasConsent] = useState(false);
  const [preferences, setPreferencesState] =
    useState<ConsentPreferences>(defaultPreferences);
  const [showBanner, setShowBanner] = useState(false);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

  const loadAnalytics = useCallback(() => {
    if (analyticsLoaded) return;
    if (document.querySelector("script[data-website-id]")) {
      setAnalyticsLoaded(true);
      return;
    }

    const enabled = import.meta.env.VITE_ANALYTICS_ENABLED === "true";
    const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

    if (!enabled || !endpoint || !websiteId) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log("[Cookie Consent] Loading analytics script");
    }

    const script = document.createElement("script");
    script.defer = true;
    script.src = `${endpoint}/script.js`;
    script.setAttribute("data-website-id", websiteId);
    script.setAttribute("data-domains", window.location.hostname);
    document.head.appendChild(script);
    setAnalyticsLoaded(true);
  }, [analyticsLoaded]);

  const saveConsent = useCallback(
    (prefs: ConsentPreferences, source: "banner" | "settings" = "banner") => {
      const consent: StoredConsent = {
        version: CONSENT_VERSION,
        timestamp: Date.now(),
        preferences: prefs,
        source,
      };

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
      setPreferencesState(prefs);
      setHasConsent(true);
      setShowBanner(false);

      if (prefs.analytics && !analyticsLoaded) {
        loadAnalytics();
      }
    },
    [analyticsLoaded, loadAnalytics]
  );

  const loadStoredConsent = useCallback(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) {
        setShowBanner(true);
        return;
      }

      const consent: StoredConsent = JSON.parse(stored);

      if (consent.version < CONSENT_VERSION) {
        setShowBanner(true);
        return;
      }

      const age = Date.now() - consent.timestamp;
      if (age > ONE_YEAR_MS) {
        setShowBanner(true);
        return;
      }

      setPreferencesState(consent.preferences);
      setHasConsent(true);
      setShowBanner(false);

      if (consent.preferences.analytics) {
        loadAnalytics();
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[Cookie Consent] Failed to load stored consent:", error);
      }
      setShowBanner(true);
    }
  }, [loadAnalytics]);

  useEffect(() => {
    loadStoredConsent();
  }, [loadStoredConsent]);

  const acceptAll = useCallback(() => {
    const prefs: ConsentPreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(prefs, "banner");
  }, [saveConsent]);

  const rejectAll = useCallback(() => {
    const prefs: ConsentPreferences = {
      essential: true,
      functional: true,
      analytics: false,
      marketing: false,
    };
    saveConsent(prefs, "banner");
  }, [saveConsent]);

  const setPreferences = useCallback(
    (partialPrefs: Partial<ConsentPreferences>) => {
      const newPrefs: ConsentPreferences = {
        ...preferences,
        ...partialPrefs,
        essential: true,
        functional: true,
      };
      saveConsent(newPrefs, "settings");
    },
    [preferences, saveConsent]
  );

  const resetConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    setPreferencesState(defaultPreferences);
    setHasConsent(false);
    setShowBanner(true);
    setAnalyticsLoaded(false);
  }, []);

  const closeBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  const value: CookieConsentContextValue = {
    hasConsent,
    preferences,
    showBanner,
    acceptAll,
    rejectAll,
    setPreferences,
    resetConsent,
    closeBanner,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error("useConsent must be used within a CookieConsentProvider");
  }
  return context;
}
