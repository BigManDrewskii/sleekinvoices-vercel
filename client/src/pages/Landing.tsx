import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  FileText,
  Send,
  DollarSign,
  BarChart3,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  CreditCard,
  Bell,
  Users,
  Mail,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import { Link } from "wouter";
import { LandingNavigation } from "@/components/LandingNavigation";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <LandingNavigation />

      {/* Hero Section with Sleeky mascot */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          {/* Sleeky Mascot */}
          <div className="mb-8">
            <img
              src="/sleeky.svg"
              alt="Sleeky - SleekInvoices mascot"
              className="h-48 sm:h-56 md:h-64 lg:h-72 mx-auto"
            />
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6">
            Get paid faster with
            <br />
            <span className="text-primary">beautiful invoices</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Create professional invoices in seconds. Built-in Stripe payments,
            automated reminders, and real-time analytics for freelancers and
            small businesses.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" asChild className="text-base px-8 h-12 rounded-full">
              <a href={getLoginUrl()}>
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-base px-8 h-12 rounded-full bg-transparent"
            >
              <a href="#features">See Features</a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              3 free invoices/month
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Everything you need to get paid
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional invoicing without the complexity or cost
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Lightning-Fast Creation"
              description="Create beautiful invoices in under 30 seconds with smart templates and auto-fill."
            />
            <FeatureCard
              icon={<CreditCard className="h-6 w-6" />}
              title="Stripe Payments"
              description="Add secure payment links. Customers pay with one click, funds arrive in 1-2 days."
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6" />}
              title="Auto Reminders"
              description="Never chase payments again. Automatic email reminders keep you top-of-mind."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Real-Time Analytics"
              description="Track revenue, outstanding balances, and payment trends at a glance."
            />
            <FeatureCard
              icon={<Mail className="h-6 w-6" />}
              title="Professional Emails"
              description="Send invoices from your custom domain. Look professional, build trust."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Client Management"
              description="Store client details, track payment history, and manage relationships."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Start invoicing in 3 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="01"
              title="Sign Up Free"
              description="Create your account in 30 seconds. No credit card required."
            />
            <StepCard
              number="02"
              title="Customize"
              description="Add your logo, choose colors, and set up your invoice template."
            />
            <StepCard
              number="03"
              title="Get Paid"
              description="Create invoices, send to clients, and receive payments automatically."
            />
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild className="text-base px-8 h-12 rounded-full">
              <a href={getLoginUrl()}>
                Start Creating Invoices
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Start free, upgrade when you're ready
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              description="Perfect for getting started"
              features={[
                "3 invoices per month",
                "Client management",
                "PDF generation",
                "Email sending",
                "Basic analytics",
              ]}
              cta="Start Free"
              ctaHref={getLoginUrl()}
            />
            <PricingCard
              name="Pro"
              price="$12"
              period="per month"
              description="Unlimited everything"
              badge="Popular"
              features={[
                "Unlimited invoices",
                "Unlimited clients",
                "Stripe payment links",
                "Auto payment reminders",
                "Advanced analytics",
                "Custom email domain",
                "Priority support",
              ]}
              cta="Start Free Trial"
              ctaHref={getLoginUrl()}
              highlighted
            />
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            All plans include bank-level security and automatic backups
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-28 bg-secondary/30">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Frequently asked questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FAQItem
              question="How does the free trial work?"
              answer="Start with 3 free invoices per month. No credit card required. Upgrade to Pro anytime for unlimited invoices."
            />
            <FAQItem
              question="Can I use my own domain?"
              answer="Yes! Pro users can send invoices from their custom domain for a professional touch."
            />
            <FAQItem
              question="How do I get paid?"
              answer="Connect your Stripe account. Customers pay directly from the invoice. Funds arrive in 1-2 days."
            />
            <FAQItem
              question="Can I cancel anytime?"
              answer="Absolutely. No contracts, no cancellation fees. Your data is always yours to export."
            />
            <FAQItem
              question="Is my data secure?"
              answer="Yes. We use bank-level encryption and never store payment information on our servers."
            />
            <FAQItem
              question="Do you offer support?"
              answer="Email support for all users, with priority support for Pro subscribers."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-3xl p-8 md:p-12 lg:p-16 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Ready to get paid faster?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of freelancers and small businesses creating professional invoices with SleekInvoices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base px-8 h-12 rounded-full">
                <a href={getLoginUrl()}>
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-6">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" />
                3 free invoices
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative mt-16">
        {/* Sleeky Mascot - Large, floating above footer */}
        <div className="container max-w-6xl mx-auto px-4">
          <img 
            src="/sleeky-relaxed.png" 
            alt="Sleeky relaxing with paid invoices" 
            className="w-48 md:w-64 lg:w-72 h-auto mb-[-2rem]"
          />
        </div>

        {/* Footer Content - Rounded top border */}
        <div className="border border-border rounded-t-2xl bg-card/30">
          <div className="container max-w-6xl mx-auto px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16 mb-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <img src="/monogram-white.svg" alt="SleekInvoices" className="h-7 w-7" />
                  <span className="font-semibold text-foreground">SleekInvoices</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Professional invoicing for freelancers and small businesses.
                </p>
              </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm">Product</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() =>
                      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="hover:text-foreground transition-colors"
                  >
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm">Company</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/landing" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/landing" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/landing" className="hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/landing" className="hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm">Resources</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/landing" className="hover:text-foreground transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/landing" className="hover:text-foreground transition-colors">
                    API Docs
                  </Link>
                </li>
                <li>
                  <Link href="/landing" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2026 SleekInvoices. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Twitter
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                LinkedIn
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-6 rounded-2xl border border-border bg-card hover:bg-secondary/30 transition-all duration-300">
      <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// Step Card Component
function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

// Pricing Card Component
function PricingCard({
  name,
  price,
  period,
  description,
  badge,
  features,
  cta,
  ctaHref,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl p-6 md:p-8 transition-all duration-300 ${
        highlighted
          ? "bg-card border-2 border-primary shadow-xl shadow-primary/10"
          : "bg-card border border-border"
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
          {badge}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold text-foreground">{price}</span>
        <span className="text-muted-foreground ml-1">/{period}</span>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check
              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                highlighted ? "text-primary" : "text-green-500"
              }`}
            />
            <span className="text-sm text-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        className={`w-full rounded-full ${highlighted ? "" : ""}`}
        size="lg"
        variant={highlighted ? "default" : "outline"}
      >
        <a href={ctaHref}>{cta}</a>
      </Button>
    </div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card">
      <h4 className="font-semibold text-foreground mb-2">{question}</h4>
      <p className="text-muted-foreground text-sm leading-relaxed">{answer}</p>
    </div>
  );
}
