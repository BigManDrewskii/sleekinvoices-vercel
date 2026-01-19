import { useAuth } from "@/_core/hooks/useAuth";
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
  const { loading } = useAuth();

  // Landing page is now public - no redirect for authenticated users
  // Users can access landing page regardless of auth state

  // Show loading spinner while checking auth (for navbar state)
  if (loading) {
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
