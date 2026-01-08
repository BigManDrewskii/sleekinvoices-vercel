import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { getLoginUrl } from "@/const";

export function LandingNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0f]/90 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20"
          : "bg-transparent"
      } rounded-full`}
    >
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-2.5">
            <img 
              src="/monogram-white.svg" 
              alt="SleekInvoices" 
              className="h-8 w-8" 
            />
            <span className="font-semibold text-foreground text-lg hidden sm:block">
              SleekInvoices
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => scrollToSection("features")}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              FAQ
            </button>
          </div>

          {/* Auth CTAs - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="rounded-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
            <Button size="sm" asChild className="rounded-full">
              <a href={getLoginUrl()}>
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                className="rounded-full"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-[#0a0a0f]/95 backdrop-blur-xl border-l border-white/10">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col gap-2 mt-8">
                <button
                  onClick={() => scrollToSection("features")}
                  className="px-4 py-3 text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="px-4 py-3 text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left"
                >
                  Pricing
                </button>
                <button
                  onClick={() => scrollToSection("faq")}
                  className="px-4 py-3 text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left"
                >
                  FAQ
                </button>

                <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
                  <Button variant="outline" className="w-full rounded-xl" asChild>
                    <a href={getLoginUrl()}>Sign In</a>
                  </Button>
                  <Button className="w-full rounded-xl" asChild>
                    <a href={getLoginUrl()}>
                      Get Started
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
