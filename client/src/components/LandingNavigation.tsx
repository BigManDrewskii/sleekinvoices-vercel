import { Button } from "@/components/ui/button";
import { Menu, ArrowRight, LayoutDashboard, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { LandingSidebar } from "./landing/LandingSidebar";

export function LandingNavigation() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollAnnouncement, setScrollAnnouncement] = useState("");

  const { isAuthenticated, loading } = useAuth({
    redirectOnUnauthenticated: false,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setScrollAnnouncement(`Navigating to ${id} section`);
      setTimeout(() => setScrollAnnouncement(""), 1000);
    }
  };

  const getSignUpUrl = () => {
    const loginUrl = getLoginUrl();
    if (loginUrl === "/") return "/";
    try {
      const url = new URL(loginUrl);
      url.searchParams.set("type", "signUp");
      return url.toString();
    } catch {
      return loginUrl;
    }
  };

  return (
    <nav
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border border-border shadow-lg shadow-black/20"
          : "bg-transparent"
      } rounded-full`}
    >
      <div className="px-5 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <Link
            href="/landing"
            className="flex items-center group flex-shrink-0"
            aria-label="SleekInvoices - Go to home"
          >
            <img
              src="/logos/wide/SleekInvoices-Logo-Wide.svg"
              alt=""
              className="h-5 sm:h-6 w-auto max-w-[120px] sm:max-w-none transition-transform duration-150 ease-out group-hover:scale-[1.03]"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("pricing")}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/docs";
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all"
            >
              Docs
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("faq")}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all"
            >
              FAQ
            </button>
          </div>

          {/* Auth CTAs - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : isAuthenticated ? (
              <Button size="sm" asChild className="rounded-full">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="rounded-full"
                >
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
                <Button size="sm" asChild className="rounded-full">
                  <a href={getSignUpUrl()}>
                    Get Started
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </a>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <LandingSidebar onNavigate={scrollToSection}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation menu"
              className="lg:hidden rounded-full"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </LandingSidebar>
        </div>
      </div>
      {/* ARIA live region for scroll announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {scrollAnnouncement}
      </div>
    </nav>
  );
}
