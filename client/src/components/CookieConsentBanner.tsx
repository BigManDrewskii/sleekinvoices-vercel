import { useState } from "react";
import { useConsent } from "@/contexts/CookieConsentContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Cookie, Settings as SettingsIcon, X } from "lucide-react";
import { Link } from "wouter";

export function CookieConsentBanner() {
  const {
    showBanner,
    preferences,
    acceptAll,
    rejectAll,
    setPreferences,
    closeBanner,
  } = useConsent();
  const [showDetailed, setShowDetailed] = useState(false);
  const [localPrefs, setLocalPrefs] = useState(preferences);

  if (!showBanner) return null;

  const handleCustomize = () => {
    setLocalPrefs(preferences);
    setShowDetailed(true);
  };

  const handleSaveCustom = () => {
    setPreferences(localPrefs);
    setShowDetailed(false);
  };

  const handleCancel = () => {
    setLocalPrefs(preferences);
    setShowDetailed(false);
  };

  if (showDetailed) {
    return (
      <div
        className="fixed inset-0 z-[var(--z-cookie-banner)] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preferences-title"
      >
        <Card className="w-full max-w-lg border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle id="cookie-preferences-title">
                    Cookie Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose which cookies you want to allow
                  </CardDescription>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="rounded-lg p-2 hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Close preferences"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Essential Cookies */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-accent/5">
              <Switch
                checked={true}
                disabled
                className="mt-1"
                aria-label="Essential cookies (required)"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-foreground">
                    Essential Cookies
                  </h4>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    Required
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  These cookies are necessary for the website to function and
                  cannot be disabled. They include authentication, security, and
                  core functionality.
                </p>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-accent/5">
              <Switch
                checked={true}
                disabled
                className="mt-1"
                aria-label="Functional cookies (required)"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-foreground">
                    Functional Cookies
                  </h4>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    Required
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Remember your preferences like theme choice and onboarding
                  progress. These improve your experience without tracking you.
                </p>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors">
              <Switch
                checked={localPrefs.analytics}
                onCheckedChange={checked =>
                  setLocalPrefs({ ...localPrefs, analytics: checked })
                }
                className="mt-1"
                aria-label="Analytics cookies"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-foreground">
                    Analytics Cookies
                  </h4>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 font-medium">
                    Optional
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Help us understand how you use SleekInvoices with
                  privacy-respecting analytics. No personal data is collected -
                  only anonymized usage patterns.
                </p>
              </div>
            </div>

            {/* Marketing Cookies - Currently None */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors opacity-50">
              <Switch
                checked={localPrefs.marketing}
                onCheckedChange={checked =>
                  setLocalPrefs({ ...localPrefs, marketing: checked })
                }
                disabled
                className="mt-1"
                aria-label="Marketing cookies (not used)"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-foreground">
                    Marketing Cookies
                  </h4>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                    Not Used
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  We don't currently use any marketing or advertising cookies.
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCustom} className="w-full sm:flex-1">
              Save Preferences
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[var(--z-cookie-banner)] animate-in slide-in-from-bottom-4 fade-in duration-300"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
    >
      <Card className="border-border bg-card shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle id="cookie-banner-title" className="text-lg">
                Cookie Preferences
              </CardTitle>
              <CardDescription id="cookie-banner-description" className="mt-1">
                We use cookies to enhance your experience
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use essential cookies for authentication and optional analytics
            to improve our service. Analytics cookies are privacy-respecting and
            don't collect personal data.
          </p>

          <Link
            href="/privacy"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
          >
            Learn more in our Privacy Policy
          </Link>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0">
          {/* Primary actions - Equal prominence for GDPR */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="outline"
              onClick={rejectAll}
              className="flex-1 touch-target"
              aria-label="Reject optional cookies"
            >
              Reject All
            </Button>
            <Button
              onClick={acceptAll}
              className="flex-1 touch-target"
              aria-label="Accept all cookies"
            >
              Accept All
            </Button>
          </div>

          {/* Secondary action */}
          <Button
            variant="ghost"
            onClick={handleCustomize}
            className="w-full text-sm"
            aria-label="Customize cookie preferences"
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Customize Preferences
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
