import { useState, useEffect } from "react";
import { Link } from "wouter";
import { LayoutDashboard, Menu, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function LandingNavigation() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollAnnouncement, setScrollAnnouncement] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setScrollAnnouncement(`Navigating to ${id} section`);
      setTimeout(() => setScrollAnnouncement(""), 1000);
    }
    setMobileMenuOpen(false);
  };

  // Generate sign up URL (same as login but with type=signUp)
  const getSignUpUrl = () => {
    const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
    const appId = import.meta.env.VITE_APP_ID;

    if (!oauthPortalUrl || !appId) {
      return "/dashboard"; // Fallback for dev mode
    }

    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    const state = btoa(redirectUri);

    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signUp");

    return url.toString();
  };

  return (
    <>
      <nav
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-w-[1152px] h-16 rounded-[33554400px] border border-[#374d58] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.2),0px_4px_6px_-4px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition-all duration-300 ${
          scrolled ? "bg-[#111d22]/90" : "bg-[#111d22]/80"
        }`}
      >
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-5">
          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0"
            aria-label="SleekInvoices - Go to home"
          >
            <img
              src="/logos/wide/SleekInvoices-Logo-Wide.svg"
              alt=""
              className="h-5 sm:h-6 w-auto max-w-[120px] sm:max-w-[140.2px]"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleNavClick("features")}
              className="rounded-[33554400px] px-4 py-2 text-sm font-medium text-[#a3b1b8] hover:text-[#f1f6f9] hover:bg-[#5f6fff]/10 transition-all"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => handleNavClick("pricing")}
              className="rounded-[33554400px] px-4 py-2 text-sm font-medium text-[#a3b1b8] hover:text-[#f1f6f9] hover:bg-[#5f6fff]/10 transition-all"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/docs";
              }}
              className="rounded-[33554400px] px-4 py-2 text-sm font-medium text-[#a3b1b8] hover:text-[#f1f6f9] hover:bg-[#5f6fff]/10 transition-all"
            >
              Docs
            </button>
            <button
              type="button"
              onClick={() => handleNavClick("faq")}
              className="rounded-[33554400px] px-4 py-2 text-sm font-medium text-[#a3b1b8] hover:text-[#f1f6f9] hover:bg-[#5f6fff]/10 transition-all"
            >
              FAQ
            </button>
          </div>

          {/* Auth CTAs - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {loading ? (
              <div className="h-8 w-24 bg-[#374d58]/50 rounded-[33554400px] animate-pulse" />
            ) : isAuthenticated ? (
              // Show Dashboard button for authenticated users
              <a
                href="/dashboard"
                className="h-8 rounded-[33554400px] bg-[#5f6fff] border border-[#5f6fff] px-4 flex items-center justify-center gap-2 text-xs font-medium text-[#f1f6f9] hover:bg-[#5f6fff]/90 transition-all"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </a>
            ) : (
              // Show Login and Sign Up for unauthenticated users
              <>
                <a
                  href={getLoginUrl()}
                  className="h-8 rounded-[33554400px] border border-[#374d58] px-4 flex items-center justify-center gap-2 text-xs font-medium text-[#a3b1b8] hover:text-[#f1f6f9] hover:border-[#5f6fff]/50 transition-all"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Log In
                </a>
                <a
                  href={getSignUpUrl()}
                  className="h-8 rounded-[33554400px] bg-[#5f6fff] border border-[#5f6fff] px-4 flex items-center justify-center gap-2 text-xs font-medium text-[#f1f6f9] hover:bg-[#5f6fff]/90 transition-all"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Sign Up Free
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="lg:hidden flex-shrink-0 h-10 w-10 rounded-full bg-[#5f6fff] flex items-center justify-center"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5 text-[#f1f6f9]" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] sm:w-[320px] bg-[#111d22] border-[#374d58] p-0"
            >
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="p-6 border-b border-[#374d58]">
                  <img
                    src="/logos/wide/SleekInvoices-Logo-Wide.svg"
                    alt="SleekInvoices"
                    className="h-6 w-auto"
                  />
                </div>

                {/* Mobile Navigation Links */}
                <div className="flex-1 p-6 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleNavClick("features")}
                    className="w-full text-left rounded-lg px-4 py-3 text-sm font-medium text-[#a3b1b8] hover:text-[#f1f6f9] hover:bg-[#5f6fff]/10 transition-all"
                  >
                    Features
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("pricing")}
                    className="w-full text-left rounded-lg px-4 py-3 text-sm font-medium text-[#a3b1b8] hover:text-[#f1f6f9] hover:bg-[#5f6fff]/10 transition-all"
                  >
                    Pricing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/docs";
                    }}
                    className="w-full text-left rounded-lg px-4 py-3 text-sm font-medium text-[#a3b1b8] hover:text-[#f1f6f9] hover:bg-[#5f6fff]/10 transition-all"
                  >
                    Docs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("faq")}
                    className="w-full text-left rounded-lg px-4 py-3 text-sm font-medium text-[#a3b1b8] hover:text-[#f1f6f9] hover:bg-[#5f6fff]/10 transition-all"
                  >
                    FAQ
                  </button>
                </div>

                {/* Mobile Auth CTAs */}
                <div className="p-6 border-t border-[#374d58] space-y-3">
                  {loading ? (
                    <div className="h-11 w-full bg-[#374d58]/50 rounded-lg animate-pulse" />
                  ) : isAuthenticated ? (
                    <a
                      href="/dashboard"
                      className="w-full h-11 rounded-lg bg-[#5f6fff] flex items-center justify-center gap-2 text-sm font-medium text-[#f1f6f9] hover:bg-[#5f6fff]/90 transition-all"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Go to Dashboard
                    </a>
                  ) : (
                    <>
                      <a
                        href={getLoginUrl()}
                        className="w-full h-11 rounded-lg border border-[#374d58] flex items-center justify-center gap-2 text-sm font-medium text-[#a3b1b8] hover:text-[#f1f6f9] hover:border-[#5f6fff]/50 transition-all"
                      >
                        <LogIn className="h-4 w-4" />
                        Log In
                      </a>
                      <a
                        href={getSignUpUrl()}
                        className="w-full h-11 rounded-lg bg-[#5f6fff] flex items-center justify-center gap-2 text-sm font-medium text-[#f1f6f9] hover:bg-[#5f6fff]/90 transition-all"
                      >
                        <UserPlus className="h-4 w-4" />
                        Sign Up Free
                      </a>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* ARIA live region for scroll announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {scrollAnnouncement}
      </div>
    </>
  );
}
