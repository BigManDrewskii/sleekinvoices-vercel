import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { FileText, Send, DollarSign, BarChart3, CheckCircle, Clock, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <img src="/SleekInvoices-Wide.svg" alt="SleekInvoices" className="h-8" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <a href={getLoginUrl()} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </a>
                <Button asChild>
                  <a href={getLoginUrl()}>Get Started</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Professional Invoicing Made Simple
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
            Create Beautiful Invoices in{" "}
            <span className="text-primary">Minutes</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The elegant invoicing solution for freelancers and small businesses. 
            Create, send, and track professional invoices with built-in payment processing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <a href={getLoginUrl()}>Start Free Trial</a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              View Demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Free for 3 invoices/month • No credit card required
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need</h2>
          <p className="text-xl text-muted-foreground">Simple, powerful, and professional</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<FileText className="h-10 w-10 text-primary" />}
            title="Professional Templates"
            description="Beautiful, customizable invoice templates that make your business look professional"
          />
          <FeatureCard
            icon={<Send className="h-10 w-10 text-primary" />}
            title="Email Invoices"
            description="Send invoices directly to clients with automatic payment reminders"
          />
          <FeatureCard
            icon={<DollarSign className="h-10 w-10 text-primary" />}
            title="Stripe Payments"
            description="Accept payments instantly with integrated Stripe payment links"
          />
          <FeatureCard
            icon={<BarChart3 className="h-10 w-10 text-primary" />}
            title="Analytics Dashboard"
            description="Track revenue, outstanding balances, and payment trends at a glance"
          />
          <FeatureCard
            icon={<Clock className="h-10 w-10 text-primary" />}
            title="Auto-Reminders"
            description="Automatic payment reminders for overdue invoices save you time"
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-primary" />}
            title="Secure & Reliable"
            description="Bank-level security with automatic backups and data encryption"
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground">No hidden fees. Cancel anytime.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PricingCard
            name="Free"
            price="$0"
            period="forever"
            features={[
              "3 invoices per month",
              "Client management",
              "PDF generation",
              "Email sending",
              "Basic analytics",
            ]}
            cta="Get Started"
            ctaHref={getLoginUrl()}
          />
          <PricingCard
            name="Pro"
            price="$12"
            period="per month"
            features={[
              "Unlimited invoices",
              "Unlimited clients",
              "Stripe payment links",
              "Auto payment reminders",
              "Advanced analytics",
              "Custom branding",
              "Priority support",
            ]}
            cta="Start Free Trial"
            ctaHref={getLoginUrl()}
            highlighted
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Paid Faster?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of freelancers and small businesses using SleekInvoices
          </p>
          <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6">
            <a href={getLoginUrl()}>Start Your Free Trial</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">SleekInvoices</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 SleekInvoices. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card border rounded-xl p-8 hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  ctaHref,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
}) {
  return (
    <div className={`bg-card border rounded-xl p-8 ${highlighted ? "ring-2 ring-primary shadow-xl" : ""}`}>
      {highlighted && (
        <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full mb-4">
          Most Popular
        </div>
      )}
      <h3 className="text-2xl font-bold text-foreground mb-2">{name}</h3>
      <div className="mb-6">
        <span className="text-5xl font-bold text-foreground">{price}</span>
        <span className="text-muted-foreground ml-2">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <Button asChild className="w-full" variant={highlighted ? "default" : "outline"}>
        <a href={ctaHref}>{cta}</a>
      </Button>
    </div>
  );
}
