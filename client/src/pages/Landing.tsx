import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { isLocalDevMode } from "@/const";
import { LandingNavigation } from "@/components/LandingNavigation";
import { GearLoader } from "@/components/ui/gear-loader";
import {
  HeroSection,
  ProductDemoSection,
  FeaturesSection,
  CryptoPaymentsSection,
  ComparisonSection,
  PricingSection,
  FAQSection,
  CTASection,
  LandingFooter,
} from "@/components/landing";

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Don't redirect while still checking auth status
    if (loading) return;

    // Redirect authenticated users to dashboard
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="opacity-70">
          <GearLoader size="md" />
        </div>
      </div>
    );
  }

  // If authenticated, don't render landing (redirect will happen)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="opacity-70">
          <GearLoader size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNavigation />

      <HeroSection />
      <ProductDemoSection />
      <FeaturesSection />
      <CryptoPaymentsSection />
      <ComparisonSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
