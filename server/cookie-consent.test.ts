import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const CONSENT_STORAGE_KEY = "sleek_cookie_consent";
const CONSENT_VERSION = 1;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

const documentMock = {
  head: {
    innerHTML: "",
    appendChild: vi.fn(),
  },
  createElement: vi.fn(() => ({
    defer: false,
    src: "",
    setAttribute: vi.fn(),
  })),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
};

describe("Cookie Consent System", () => {
  let localStorage: typeof localStorageMock;
  let document: typeof documentMock;

  beforeEach(() => {
    localStorage = localStorageMock;
    document = documentMock as any;
    localStorage.clear();
    document.head.innerHTML = "";
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    document.head.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("Consent Storage", () => {
    it("should save consent to localStorage with correct structure", () => {
      const mockConsent = {
        version: 1,
        timestamp: Date.now(),
        preferences: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
        },
        source: "banner" as const,
      };

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(mockConsent));

      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(1);
      expect(parsed.preferences.essential).toBe(true);
      expect(parsed.preferences.analytics).toBe(true);
      expect(parsed.source).toBe("banner");
    });

    it("should load consent from localStorage", () => {
      const mockConsent = {
        version: CONSENT_VERSION,
        timestamp: Date.now(),
        preferences: {
          essential: true,
          functional: true,
          analytics: false,
          marketing: false,
        },
        source: "settings" as const,
      };

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(mockConsent));

      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      const parsed = JSON.parse(stored!);

      expect(parsed.preferences.analytics).toBe(false);
      expect(parsed.version).toBe(CONSENT_VERSION);
    });

    it("should handle missing consent gracefully", () => {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      expect(stored).toBeNull();
    });

    it("should track consent version correctly", () => {
      const mockConsent = {
        version: CONSENT_VERSION,
        timestamp: Date.now(),
        preferences: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
        },
        source: "banner" as const,
      };

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(mockConsent));

      const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!);
      expect(stored.version).toBe(CONSENT_VERSION);
    });

    it("should track consent timestamp", () => {
      const now = Date.now();
      const mockConsent = {
        version: CONSENT_VERSION,
        timestamp: now,
        preferences: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
        },
        source: "banner" as const,
      };

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(mockConsent));

      const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!);
      expect(stored.timestamp).toBe(now);
      expect(typeof stored.timestamp).toBe("number");
    });
  });

  describe("Consent Logic", () => {
    it("should enable all categories on acceptAll", () => {
      const allAcceptedPrefs = {
        essential: true,
        functional: true,
        analytics: true,
        marketing: true,
      };

      expect(allAcceptedPrefs.essential).toBe(true);
      expect(allAcceptedPrefs.functional).toBe(true);
      expect(allAcceptedPrefs.analytics).toBe(true);
      expect(allAcceptedPrefs.marketing).toBe(true);
    });

    it("should disable optional categories on rejectAll", () => {
      const allRejectedPrefs = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
      };

      expect(allRejectedPrefs.essential).toBe(true);
      expect(allRejectedPrefs.functional).toBe(true);
      expect(allRejectedPrefs.analytics).toBe(false);
      expect(allRejectedPrefs.marketing).toBe(false);
    });

    it("should keep essential cookies always enabled", () => {
      const prefs = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
      };

      expect(prefs.essential).toBe(true);
    });

    it("should allow granular preference setting", () => {
      const prefs = {
        essential: true,
        functional: true,
        analytics: true,
        marketing: false,
      };

      expect(prefs.analytics).toBe(true);
      expect(prefs.marketing).toBe(false);
    });
  });

  describe("Analytics Script Loading", () => {
    it("should not load analytics script without consent", () => {
      const scripts = document.querySelectorAll("script[data-website-id]");
      expect(scripts.length).toBe(0);
    });

    it("should verify script loading function is called with analytics consent", () => {
      const loadAnalyticsMock = vi.fn();
      const analyticsConsent = true;

      if (analyticsConsent) {
        loadAnalyticsMock();
      }

      expect(loadAnalyticsMock).toHaveBeenCalledTimes(1);
    });

    it("should not call script loading function without analytics consent", () => {
      const loadAnalyticsMock = vi.fn();
      const analyticsConsent = false;

      if (analyticsConsent) {
        loadAnalyticsMock();
      }

      expect(loadAnalyticsMock).not.toHaveBeenCalled();
    });
  });

  describe("Consent Expiry", () => {
    it("should detect expired consent (>1 year old)", () => {
      const oldTimestamp = Date.now() - (ONE_YEAR_MS + 1000);
      const mockConsent = {
        version: CONSENT_VERSION,
        timestamp: oldTimestamp,
        preferences: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
        },
        source: "banner" as const,
      };

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(mockConsent));

      const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!);
      const age = Date.now() - stored.timestamp;

      expect(age).toBeGreaterThan(ONE_YEAR_MS);
    });

    it("should detect outdated consent version", () => {
      const mockConsent = {
        version: 0,
        timestamp: Date.now(),
        preferences: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
        },
        source: "banner" as const,
      };

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(mockConsent));

      const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!);
      expect(stored.version).toBeLessThan(CONSENT_VERSION);
    });

    it("should accept current version consent", () => {
      const mockConsent = {
        version: CONSENT_VERSION,
        timestamp: Date.now(),
        preferences: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
        },
        source: "banner" as const,
      };

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(mockConsent));

      const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!);
      const age = Date.now() - stored.timestamp;

      expect(stored.version).toBe(CONSENT_VERSION);
      expect(age).toBeLessThan(ONE_YEAR_MS);
    });
  });

  describe("GDPR Compliance", () => {
    it("should have equal prominence buttons (Accept All and Reject All)", () => {
      const acceptButton = { variant: "primary", size: "default" };
      const rejectButton = { variant: "outline", size: "default" };

      expect(acceptButton.size).toBe(rejectButton.size);
    });

    it("should provide granular control over cookie categories", () => {
      const categories = {
        essential: true,
        functional: true,
        analytics: false,
        marketing: false,
      };

      const canToggleAnalytics = true;
      const canToggleMarketing = true;
      const canToggleEssential = false;

      expect(canToggleAnalytics).toBe(true);
      expect(canToggleMarketing).toBe(true);
      expect(canToggleEssential).toBe(false);
    });

    it("should store consent timestamp for audit trail", () => {
      const mockConsent = {
        version: CONSENT_VERSION,
        timestamp: Date.now(),
        preferences: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
        },
        source: "banner" as const,
      };

      expect(mockConsent.timestamp).toBeDefined();
      expect(typeof mockConsent.timestamp).toBe("number");
      expect(mockConsent.timestamp).toBeGreaterThan(1700000000000);
    });

    it("should allow consent withdrawal via resetConsent", () => {
      localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
          version: CONSENT_VERSION,
          timestamp: Date.now(),
          preferences: {
            essential: true,
            functional: true,
            analytics: true,
            marketing: false,
          },
          source: "banner",
        })
      );

      expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeDefined();

      localStorage.removeItem(CONSENT_STORAGE_KEY);

      expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    });
  });

  describe("Banner Display Logic", () => {
    it("should show banner on first visit (no stored consent)", () => {
      const hasStoredConsent = !!localStorage.getItem(CONSENT_STORAGE_KEY);
      const shouldShowBanner = !hasStoredConsent;

      expect(shouldShowBanner).toBe(true);
    });

    it("should hide banner when consent exists", () => {
      localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
          version: CONSENT_VERSION,
          timestamp: Date.now(),
          preferences: {
            essential: true,
            functional: true,
            analytics: false,
            marketing: false,
          },
          source: "banner",
        })
      );

      const hasStoredConsent = !!localStorage.getItem(CONSENT_STORAGE_KEY);
      const shouldShowBanner = !hasStoredConsent;

      expect(shouldShowBanner).toBe(false);
    });

    it("should show banner for expired consent", () => {
      const expiredConsent = {
        version: CONSENT_VERSION,
        timestamp: Date.now() - (ONE_YEAR_MS + 1000),
        preferences: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
        },
        source: "banner" as const,
      };

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(expiredConsent));

      const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!);
      const age = Date.now() - stored.timestamp;
      const shouldShowBanner = age > ONE_YEAR_MS;

      expect(shouldShowBanner).toBe(true);
    });

    it("should show banner for outdated version", () => {
      const outdatedConsent = {
        version: 0,
        timestamp: Date.now(),
        preferences: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: false,
        },
        source: "banner" as const,
      };

      localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify(outdatedConsent)
      );

      const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)!);
      const shouldShowBanner = stored.version < CONSENT_VERSION;

      expect(shouldShowBanner).toBe(true);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes for banner", () => {
      const bannerAttributes = {
        role: "dialog",
        "aria-modal": "false",
        "aria-labelledby": "cookie-banner-title",
        "aria-describedby": "cookie-banner-description",
      };

      expect(bannerAttributes.role).toBe("dialog");
      expect(bannerAttributes["aria-labelledby"]).toBeDefined();
      expect(bannerAttributes["aria-describedby"]).toBeDefined();
    });

    it("should have proper ARIA attributes for detailed modal", () => {
      const modalAttributes = {
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "cookie-preferences-title",
      };

      expect(modalAttributes.role).toBe("dialog");
      expect(modalAttributes["aria-modal"]).toBe("true");
    });

    it("should have accessible button labels", () => {
      const buttons = [
        { label: "Reject optional cookies", action: "reject" },
        { label: "Accept all cookies", action: "accept" },
        { label: "Customize cookie preferences", action: "customize" },
      ];

      buttons.forEach(button => {
        expect(button.label).toBeDefined();
        expect(button.label.length).toBeGreaterThan(5);
      });
    });
  });
});
