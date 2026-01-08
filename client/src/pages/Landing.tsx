import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  FileText,
  BarChart3,
  Zap,
  CreditCard,
  Bell,
  Users,
  Mail,
  ArrowRight,
  Check,
  X,
  Bitcoin,
  RefreshCw,
  FileCheck,
  Receipt,
  Globe,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { LandingNavigation } from "@/components/LandingNavigation";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <LandingNavigation />

      {/* AND.CO Migration Banner - Refined, less obtrusive */}
      <div className="border-b border-amber-500/10">
        <div className="container max-w-5xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <span className="text-amber-400/80">
              AND.CO shutting down?{" "}
              <a href={getLoginUrl()} className="text-amber-300 hover:text-amber-200 underline underline-offset-2">
                Migrate free →
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section - Clean, focused */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          {/* Sleeky Mascot */}
          <div className="mb-6">
            <img
              src="/sleeky.svg"
              alt="Sleeky - SleekInvoices mascot"
              className="h-40 sm:h-48 md:h-56 mx-auto sleeky-float"
            />
          </div>

          {/* Main headline - Concise */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-4">
            Invoice smarter.
            <br />
            <span className="text-primary">Get paid faster.</span>
          </h1>

          {/* Subheadline - One clear value prop */}
          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8">
            Professional invoicing with Stripe, crypto payments, and QuickBooks sync. 
            Starting at $0/month.
          </p>

          {/* Single CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Button size="lg" asChild className="text-base px-8 h-12 rounded-full">
              <a href={getLoginUrl()}>
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="text-base px-8 h-12 rounded-full text-zinc-400 hover:text-white hover:bg-white/5"
            >
              <a href="#features">See Features</a>
            </Button>
          </div>

          {/* Trust indicators - Minimal */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
            <span>No credit card required</span>
            <span className="hidden sm:inline">•</span>
            <span>3 free invoices/month</span>
            <span className="hidden sm:inline">•</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 border-y border-white/5">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-zinc-500 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">1,200+</span>
              <span>invoices sent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">$2M+</span>
              <span>processed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">4.9★</span>
              <span>user rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Improved aesthetic */}
      <section id="features" className="py-20 md:py-28">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Everything you need
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              Professional invoicing without the complexity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="30-Second Invoices"
              description="Smart templates and auto-fill get you paid faster."
            />
            <FeatureCard
              icon={<CreditCard className="h-5 w-5" />}
              title="Stripe + Crypto"
              description="Accept cards or 300+ cryptocurrencies."
            />
            <FeatureCard
              icon={<Bell className="h-5 w-5" />}
              title="Auto Reminders"
              description="Never chase payments again."
            />
            <FeatureCard
              icon={<RefreshCw className="h-5 w-5" />}
              title="Recurring Billing"
              description="Set up once, get paid automatically."
            />
            <FeatureCard
              icon={<FileCheck className="h-5 w-5" />}
              title="Estimates & Quotes"
              description="Convert to invoices with one click."
            />
            <FeatureCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="Real-Time Analytics"
              description="Track revenue and outstanding balances."
            />
          </div>
        </div>
      </section>

      {/* Crypto Highlight - Streamlined */}
      <section className="py-16 border-y border-white/5">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 text-sm font-medium mb-4">
                <Bitcoin className="h-4 w-4" />
                Exclusive
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Accept crypto payments
              </h2>
              <p className="text-zinc-400 mb-4">
                The only invoicing tool with native crypto support. 
                No chargebacks, instant settlement.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300">BTC</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300">ETH</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300">USDT</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300">+300 more</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xl font-bold text-white">0</div>
                  <div className="text-xs text-zinc-500">Chargebacks</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xl font-bold text-white">24/7</div>
                  <div className="text-xs text-zinc-500">Settlement</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xl font-bold text-white">1%</div>
                  <div className="text-xs text-zinc-500">Fee</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Competitor Comparison Section */}
      <section id="compare" className="py-20 md:py-28">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              See how we compare
            </h2>
            <p className="text-zinc-400">
              All the features at a fraction of the price
            </p>
          </div>

          {/* Mobile Comparison Cards */}
          <div className="md:hidden space-y-3">
            <MobileComparisonCard
              feature="Unlimited Invoices"
              sleek={true}
              freshbooks="Premium only"
              quickbooks={true}
              wave={true}
            />
            <MobileComparisonCard
              feature="Unlimited Clients"
              sleek={true}
              freshbooks="5 on Lite"
              quickbooks={true}
              wave={true}
            />
            <MobileComparisonCard
              feature="Crypto Payments"
              sleek={true}
              freshbooks={false}
              quickbooks={false}
              wave={false}
              highlight
            />
            <MobileComparisonCard
              feature="Auto Reminders"
              sleek={true}
              freshbooks={true}
              quickbooks={true}
              wave={false}
            />
            <MobileComparisonCard
              feature="QuickBooks Sync"
              sleek={true}
              freshbooks={false}
              quickbooks={true}
              wave={false}
              highlight
            />
          </div>

          {/* Desktop Comparison Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 font-medium text-zinc-500">Feature</th>
                  <th className="text-center py-4 px-4">
                    <div className="font-bold text-primary">SleekInvoices</div>
                    <div className="text-sm text-zinc-500">$12/mo</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="font-medium text-zinc-300">FreshBooks</div>
                    <div className="text-sm text-zinc-500">$21-65/mo</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="font-medium text-zinc-300">QuickBooks</div>
                    <div className="text-sm text-zinc-500">$38-75/mo</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="font-medium text-zinc-300">AND.CO</div>
                    <div className="text-sm text-zinc-500">$18-24/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  feature="Unlimited Invoices"
                  sleek={true}
                  freshbooks="Premium only"
                  quickbooks={true}
                  wave={true}
                />
                <ComparisonRow
                  feature="Multiple Templates"
                  sleek={true}
                  freshbooks={true}
                  quickbooks={true}
                  wave={false}
                  highlight
                />
                <ComparisonRow
                  feature="Crypto Payments"
                  sleek={true}
                  freshbooks={false}
                  quickbooks={false}
                  wave={false}
                  highlight
                />
                <ComparisonRow
                  feature="QuickBooks Sync"
                  sleek={true}
                  freshbooks={false}
                  quickbooks={true}
                  wave={false}
                  highlight
                />
                <ComparisonRow
                  feature="Auto Reminders"
                  sleek={true}
                  freshbooks={true}
                  quickbooks={true}
                  wave={false}
                />
                <ComparisonRow
                  feature="Recurring Invoices"
                  sleek={true}
                  freshbooks={true}
                  quickbooks="$20+ tier"
                  wave={true}
                />
                <ComparisonRow
                  feature="Client Portal"
                  sleek={true}
                  freshbooks={true}
                  quickbooks={true}
                  wave={false}
                />
                <ComparisonRow
                  feature="AI Invoice Creation"
                  sleek={true}
                  freshbooks={false}
                  quickbooks={false}
                  wave={false}
                  highlight
                />
              </tbody>
            </table>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild className="text-base px-8 h-12 rounded-full">
              <a href={getLoginUrl()}>
                Start Saving Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Start in 3 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              number="01"
              title="Sign Up"
              description="Create your account in 30 seconds."
            />
            <StepCard
              number="02"
              title="Customize"
              description="Add your logo and brand colors."
            />
            <StepCard
              number="03"
              title="Get Paid"
              description="Send invoices and receive payments."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 border-t border-white/5">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Simple pricing
            </h2>
            <p className="text-zinc-400">
              Start free, upgrade when ready
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
              description="Everything unlimited"
              badge="Popular"
              features={[
                "Unlimited invoices",
                "Unlimited clients",
                "Stripe + Crypto payments",
                "Auto payment reminders",
                "Recurring invoices",
                "QuickBooks sync",
                "AI Magic Invoice",
                "Priority support",
              ]}
              cta="Start Free Trial"
              ctaHref={getLoginUrl()}
              highlighted
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-28 border-t border-white/5">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Questions?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FAQItem
              question="How does the free tier work?"
              answer="Get 3 free invoices per month forever. No credit card required. Upgrade to Pro anytime for unlimited invoices."
            />
            <FAQItem
              question="Why so much cheaper?"
              answer="We focus on invoicing, not bloated accounting features. Just powerful invoicing at a fair price."
            />
            <FAQItem
              question="How do crypto payments work?"
              answer="Enable crypto and clients can pay with Bitcoin, Ethereum, and 300+ cryptocurrencies. Instant settlement, no chargebacks."
            />
            <FAQItem
              question="Can I migrate from AND.CO?"
              answer="Yes! Export your client list and import directly into SleekInvoices. We're building direct migration tools."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to get paid?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
              Join thousands of freelancers and small businesses using SleekInvoices.
            </p>
            <Button size="lg" asChild className="text-base px-8 h-12 rounded-full">
              <a href={getLoginUrl()}>
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative mt-8">
        {/* Sleeky Mascot */}
        <div className="container max-w-5xl mx-auto px-4">
          <img 
            src="/sleeky-relaxed.png" 
            alt="Sleeky relaxing" 
            className="w-40 md:w-56 h-auto mb-[-1.5rem] sleeky-float"
          />
        </div>

        {/* Footer Content */}
        <div className="border-t border-white/10 bg-white/[0.02]">
          <div className="container max-w-5xl mx-auto px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16 mb-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <img src="/monogram-white.svg" alt="SleekInvoices" className="h-7 w-7" />
                  <span className="font-semibold text-white">SleekInvoices</span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Professional invoicing for freelancers and small businesses.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#compare" className="hover:text-white transition-colors">Compare</a></li>
                  <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                  <li><a href="mailto:support@sleekinvoices.com" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="/terms" className="hover:text-white transition-colors">Terms</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-4">Compare</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                  <li><span className="text-zinc-600">vs FreshBooks</span></li>
                  <li><span className="text-zinc-600">vs QuickBooks</span></li>
                  <li><span className="text-zinc-600">vs AND.CO</span></li>
                  <li><span className="text-zinc-600">vs Wave</span></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-zinc-600">
                © {new Date().getFullYear()} SleekInvoices. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-sm text-zinc-600">
                <span>Made with ❤️ for freelancers</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component - Cleaner design
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
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
      </div>
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
      <div className="text-4xl font-bold text-primary/30 mb-3">{number}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  );
}

// Pricing Card Component
function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaHref,
  highlighted = false,
  badge,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl p-6 ${
        highlighted
          ? "bg-primary/5 border-2 border-primary/30"
          : "bg-white/[0.02] border border-white/10"
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {badge}
          </span>
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">{name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="text-zinc-500">/{period}</span>
        </div>
        <p className="text-sm text-zinc-500 mt-2">{description}</p>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        asChild
        className={`w-full rounded-full ${
          highlighted ? "" : "bg-white/10 hover:bg-white/20 text-white"
        }`}
        variant={highlighted ? "default" : "ghost"}
      >
        <a href={ctaHref}>{cta}</a>
      </Button>
    </div>
  );
}

// FAQ Item Component
function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
      <h3 className="font-medium text-white mb-2">{question}</h3>
      <p className="text-sm text-zinc-500">{answer}</p>
    </div>
  );
}

// Comparison Row Component
function ComparisonRow({
  feature,
  sleek,
  freshbooks,
  quickbooks,
  wave,
  highlight = false,
}: {
  feature: string;
  sleek: boolean | string;
  freshbooks: boolean | string;
  quickbooks: boolean | string;
  wave: boolean | string;
  highlight?: boolean;
}) {
  const renderValue = (value: boolean | string) => {
    if (value === true) return <Check className="h-5 w-5 text-green-500 mx-auto" />;
    if (value === false) return <X className="h-5 w-5 text-zinc-600 mx-auto" />;
    return <span className="text-sm text-zinc-500">{value}</span>;
  };

  return (
    <tr className={`border-b border-white/5 ${highlight ? "bg-primary/5" : ""}`}>
      <td className="py-4 px-4 text-sm text-zinc-300">{feature}</td>
      <td className="py-4 px-4 text-center">{renderValue(sleek)}</td>
      <td className="py-4 px-4 text-center">{renderValue(freshbooks)}</td>
      <td className="py-4 px-4 text-center">{renderValue(quickbooks)}</td>
      <td className="py-4 px-4 text-center">{renderValue(wave)}</td>
    </tr>
  );
}

// Mobile Comparison Card Component
function MobileComparisonCard({
  feature,
  sleek,
  freshbooks,
  quickbooks,
  wave,
  highlight = false,
}: {
  feature: string;
  sleek: boolean | string;
  freshbooks: boolean | string;
  quickbooks: boolean | string;
  wave: boolean | string;
  highlight?: boolean;
}) {
  const renderValue = (value: boolean | string, label: string) => {
    if (value === true) return <Check className="h-4 w-4 text-green-500" />;
    if (value === false) return <X className="h-4 w-4 text-zinc-600" />;
    return <span className="text-xs text-zinc-500">{value}</span>;
  };

  return (
    <div className={`p-4 rounded-xl border ${highlight ? "bg-primary/5 border-primary/20" : "bg-white/[0.02] border-white/5"}`}>
      <h4 className="font-medium text-white mb-3">{feature}</h4>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-xs text-primary font-medium mb-1">Sleek</div>
          {renderValue(sleek, "SleekInvoices")}
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-1">Fresh</div>
          {renderValue(freshbooks, "FreshBooks")}
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-1">QB</div>
          {renderValue(quickbooks, "QuickBooks")}
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-1">AND.CO</div>
          {renderValue(wave, "AND.CO")}
        </div>
      </div>
    </div>
  );
}
