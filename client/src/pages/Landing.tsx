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
} from "lucide-react";
import { Link } from "wouter";
import { LandingNavigation } from "@/components/LandingNavigation";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <LandingNavigation />

      {/* AND.CO Migration Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20">
        <div className="container max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-amber-200">
              <strong>AND.CO shutting down March 2026?</strong>{" "}
              <a href={getLoginUrl()} className="underline hover:text-amber-100">
                Migrate to SleekInvoices free →
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section with Sleeky mascot */}
      <section className="pt-24 pb-20 md:pt-32 md:pb-32">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          {/* Sleeky Mascot */}
          <div className="mb-8">
            <img
              src="/sleeky.svg"
              alt="Sleeky - SleekInvoices mascot"
              className="h-48 sm:h-56 md:h-64 lg:h-72 mx-auto sleeky-float"
            />
          </div>

          {/* Competitive Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            FreshBooks features at 80% less
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6">
            Professional invoicing
            <br />
            <span className="text-primary">for just $12/month</span>
          </h1>

          {/* Subheadline with competitive positioning */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">
            Why pay $65/month for FreshBooks or $75/month for QuickBooks? Get unlimited invoices, 
            Stripe payments, auto reminders, and crypto support—all in one simple tool.
          </p>

          {/* Price Comparison Callout */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
              <Check className="h-4 w-4" />
              <span>Unlimited clients (FreshBooks caps at 5)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
              <Check className="h-4 w-4" />
              <span>No hidden fees</span>
            </div>
          </div>

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
              <a href="#compare">Compare Plans</a>
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

      {/* Crypto Payments Highlight */}
      <section className="py-16 bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-blue-500/10 border-y border-border">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm font-medium mb-4">
                <Bitcoin className="h-4 w-4" />
                Exclusive Feature
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Accept crypto payments
              </h2>
              <p className="text-muted-foreground mb-4">
                The only invoicing tool with native crypto support. Accept Bitcoin, Ethereum, USDT, 
                and 300+ cryptocurrencies. No major competitor offers this.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-card border border-border text-sm">BTC</span>
                <span className="px-3 py-1 rounded-full bg-card border border-border text-sm">ETH</span>
                <span className="px-3 py-1 rounded-full bg-card border border-border text-sm">USDT</span>
                <span className="px-3 py-1 rounded-full bg-card border border-border text-sm">USDC</span>
                <span className="px-3 py-1 rounded-full bg-card border border-border text-sm">+300 more</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <div className="text-2xl font-bold text-foreground">35%</div>
                  <div className="text-xs text-muted-foreground">SMBs accept crypto</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <div className="text-2xl font-bold text-foreground">0</div>
                  <div className="text-xs text-muted-foreground">Chargebacks</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <div className="text-2xl font-bold text-foreground">24/7</div>
                  <div className="text-xs text-muted-foreground">Settlement</div>
                </div>
              </div>
            </div>
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
              title="Stripe + Crypto Payments"
              description="Accept cards via Stripe or crypto via NOWPayments. Your clients choose how to pay."
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6" />}
              title="Auto Reminders"
              description="Never chase payments again. Automatic email reminders keep you top-of-mind."
            />
            <FeatureCard
              icon={<RefreshCw className="h-6 w-6" />}
              title="Recurring Invoices"
              description="Set up automated billing for retainer clients. Invoice once, get paid forever."
            />
            <FeatureCard
              icon={<FileCheck className="h-6 w-6" />}
              title="Estimates & Quotes"
              description="Send professional quotes. Convert to invoices with one click when approved."
            />
            <FeatureCard
              icon={<Receipt className="h-6 w-6" />}
              title="Expense Tracking"
              description="Track business expenses, attach receipts, and add billable expenses to invoices."
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
              title="Client Portal"
              description="Clients view invoices, download PDFs, and pay—all in one branded portal."
            />
          </div>
        </div>
      </section>

      {/* Competitor Comparison Section */}
      <section id="compare" className="py-20 md:py-28 bg-secondary/30">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              See how we compare
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              All the features you need at a fraction of the price
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Feature</th>
                  <th className="text-center py-4 px-4">
                    <div className="font-bold text-primary">SleekInvoices</div>
                    <div className="text-sm text-muted-foreground">$12/mo</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="font-medium text-foreground">FreshBooks</div>
                    <div className="text-sm text-muted-foreground">$21-65/mo</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="font-medium text-foreground">QuickBooks</div>
                    <div className="text-sm text-muted-foreground">$38-75/mo</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="font-medium text-foreground">Wave</div>
                    <div className="text-sm text-muted-foreground">Free-$16/mo</div>
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
                  feature="Unlimited Clients"
                  sleek={true}
                  freshbooks="5 on Lite"
                  quickbooks={true}
                  wave={true}
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
                  feature="Estimates/Quotes"
                  sleek={true}
                  freshbooks={true}
                  quickbooks={true}
                  wave={true}
                />
                <ComparisonRow
                  feature="Expense Tracking"
                  sleek={true}
                  freshbooks={true}
                  quickbooks={true}
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
                  feature="Multi-Currency"
                  sleek={true}
                  freshbooks={true}
                  quickbooks="$75/mo tier"
                  wave="Removed"
                />
                <ComparisonRow
                  feature="No Branding"
                  sleek={true}
                  freshbooks={true}
                  quickbooks={true}
                  wave="Paid only"
                />
                <ComparisonRow
                  feature="Human Support"
                  sleek={true}
                  freshbooks={true}
                  quickbooks={true}
                  wave="1.1★ rating"
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
      <section className="py-20 md:py-28">
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
      <section id="pricing" className="py-20 md:py-28 bg-secondary/30">
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
              description="Save 80% vs FreshBooks Premium"
              badge="Best Value"
              features={[
                "Unlimited invoices",
                "Unlimited clients",
                "Stripe + Crypto payments",
                "Auto payment reminders",
                "Recurring invoices",
                "Estimates & quotes",
                "Expense tracking",
                "Client portal",
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
      <section id="faq" className="py-20 md:py-28">
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
              question="Why is SleekInvoices so much cheaper?"
              answer="We focus on what freelancers actually need—invoicing. No bloated accounting features you'll never use. Just powerful invoicing at a fair price."
            />
            <FAQItem
              question="How do crypto payments work?"
              answer="Enable crypto payments and your clients can pay with Bitcoin, Ethereum, USDT, and 300+ cryptocurrencies. Funds convert automatically or stay in crypto—your choice."
            />
            <FAQItem
              question="Can I migrate from FreshBooks or Wave?"
              answer="Yes! Export your client list and import it directly into SleekInvoices. We're also building direct migration tools."
            />
            <FAQItem
              question="Is my data secure?"
              answer="Yes. We use bank-level encryption and never store payment information on our servers. Payments are processed by Stripe and NOWPayments."
            />
            <FAQItem
              question="Can I cancel anytime?"
              answer="Absolutely. No contracts, no cancellation fees. Your data is always yours to export."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-3xl p-8 md:p-12 lg:p-16 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Stop overpaying for invoicing
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join freelancers and small businesses saving hundreds per year with SleekInvoices.
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
        <div className="container max-w-5xl mx-auto px-4">
          <img 
            src="/sleeky-relaxed.png" 
            alt="Sleeky relaxing with paid invoices" 
            className="w-48 md:w-64 lg:w-72 h-auto mb-[-2rem] sleeky-float"
          />
        </div>

        {/* Footer Content - Rounded top border */}
        <div className="border border-border rounded-t-2xl bg-card/30">
          <div className="container max-w-5xl mx-auto px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16 mb-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <img src="/monogram-white.svg" alt="SleekInvoices" className="h-7 w-7" />
                  <span className="font-semibold text-foreground">SleekInvoices</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Professional invoicing for freelancers and small businesses. 80% cheaper than the competition.
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
                      document.getElementById("compare")?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="hover:text-foreground transition-colors"
                  >
                    Compare
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
              <h4 className="font-semibold text-foreground mb-4 text-sm">Migrate From</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a href={getLoginUrl()} className="hover:text-foreground transition-colors">
                    FreshBooks
                  </a>
                </li>
                <li>
                  <a href={getLoginUrl()} className="hover:text-foreground transition-colors">
                    Wave
                  </a>
                </li>
                <li>
                  <a href={getLoginUrl()} className="hover:text-foreground transition-colors">
                    AND.CO
                  </a>
                </li>
                <li>
                  <a href={getLoginUrl()} className="hover:text-foreground transition-colors">
                    HoneyBook
                  </a>
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
    if (value === true) {
      return <Check className="h-5 w-5 text-green-500 mx-auto" />;
    }
    if (value === false) {
      return <X className="h-5 w-5 text-red-500/50 mx-auto" />;
    }
    return <span className="text-sm text-muted-foreground">{value}</span>;
  };

  return (
    <tr className={`border-b border-border ${highlight ? "bg-primary/5" : ""}`}>
      <td className="py-4 px-4 text-sm text-foreground">{feature}</td>
      <td className="py-4 px-4 text-center bg-primary/5">{renderValue(sleek)}</td>
      <td className="py-4 px-4 text-center">{renderValue(freshbooks)}</td>
      <td className="py-4 px-4 text-center">{renderValue(quickbooks)}</td>
      <td className="py-4 px-4 text-center">{renderValue(wave)}</td>
    </tr>
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
