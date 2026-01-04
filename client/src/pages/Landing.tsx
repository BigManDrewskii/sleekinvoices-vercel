import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { 
  FileText, Send, DollarSign, BarChart3, CheckCircle, Clock, Shield,
  Zap, CreditCard, Bell, Users, Mail, Sparkles, ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { LandingNavigation } from "@/components/LandingNavigation";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <LandingNavigation />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column - Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-block px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium">
              ✨ Professional Invoicing Made Simple
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight">
              Create Professional Invoices in{" "}
              <span className="text-primary">Seconds</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              The modern invoicing solution for freelancers and small businesses. 
              Get paid faster with beautiful invoices, built-in Stripe payments, and automated reminders.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Button size="lg" asChild className="text-lg px-8 py-6">
                <a href={getLoginUrl()}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />
              No credit card required
              <span className="mx-2">•</span>
              <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />
              3 free invoices/month
              <span className="mx-2">•</span>
              <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />
              Cancel anytime
            </p>
          </div>

          {/* Right Column - Visual */}
          <div className="relative order-first lg:order-last">
            <div className="relative bg-card rounded-2xl p-8 border border-border">
              {/* Product screenshot mockup */}
              <div className="bg-muted rounded-xl shadow-2xl border border-border overflow-hidden">
                <div className="bg-secondary p-4 border-b border-border flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/50"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500/50"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500/50"></div>
                  </div>
                  <div className="flex-1 text-center text-xs text-muted-foreground">
                    SleekInvoices - New Invoice
                  </div>
                </div>
                <div className="p-6 space-y-4 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Invoice #INV-001</div>
                    <div className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full">Draft</div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <div className="h-2 bg-muted rounded w-full"></div>
                      <div className="h-2 bg-muted rounded w-3/4"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-muted rounded w-full"></div>
                      <div className="h-2 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="text-2xl font-bold text-primary">$1,250.00</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg">
                <Zap className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need to Get Paid
          </h2>
          <p className="text-xl text-muted-foreground">
            Professional invoicing without the complexity or cost
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Lightning-Fast Creation"
            description="Create beautiful invoices in under 30 seconds with smart templates and auto-fill. Add your logo, customize colors, and send instantly."
            iconColor="text-yellow-500"
          />
          <FeatureCard
            icon={<CreditCard className="h-8 w-8" />}
            title="Get Paid with Stripe"
            description="Add secure payment links to every invoice. Customers pay with one click, funds arrive in 1-2 days. No setup required."
            iconColor="text-blue-500"
          />
          <FeatureCard
            icon={<Bell className="h-8 w-8" />}
            title="Automated Reminders"
            description="Never chase payments again. Automatic email reminders keep you top-of-mind without awkward follow-ups."
            iconColor="text-purple-500"
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="Real-Time Analytics"
            description="Track revenue, outstanding balances, and payment trends at a glance. Know exactly where your business stands."
            iconColor="text-green-500"
          />
          <FeatureCard
            icon={<Mail className="h-8 w-8" />}
            title="Professional Emails"
            description="Send invoices from your custom domain (invoices@yourbusiness.com). Look professional, build trust, get paid faster."
            iconColor="text-primary"
          />
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="Client Management"
            description="Store client details, track payment history, and manage relationships in one organized place."
            iconColor="text-rose-500"
          />
        </div>
        
        {/* CTA after features */}
        <div className="text-center mt-16">
          <Button size="lg" asChild className="text-lg px-8 py-6">
            <a href={getLoginUrl()}>
              Start Creating Invoices Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 bg-secondary/20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Start Invoicing in 3 Simple Steps
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          <StepCard
            number="1"
            title="Sign Up Free"
            description="Create your account in 30 seconds. No credit card required."
            icon={<Users className="h-6 w-6" />}
          />
          <StepCard
            number="2"
            title="Customize Your Brand"
            description="Add your logo, choose colors, and set up your invoice template."
            icon={<Sparkles className="h-6 w-6" />}
          />
          <StepCard
            number="3"
            title="Send & Get Paid"
            description="Create invoices, send to clients, and receive payments automatically."
            icon={<Send className="h-6 w-6" />}
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground">
            Start free, upgrade when you're ready. No hidden fees, cancel anytime.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
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
            badge="Most Popular"
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
          All plans include bank-level security, automatic backups, and data encryption
        </p>
      </section>
      
      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-16 md:py-24 bg-secondary/20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
          <FAQItem
            question="How does the free trial work?"
            answer="Start with 3 free invoices per month. No credit card required. Upgrade to Pro anytime for unlimited invoices and premium features."
          />
          <FAQItem
            question="Can I use my own domain for emails?"
            answer="Yes! Pro users can send invoices from their custom domain (invoices@yourbusiness.com) for a professional touch."
          />
          <FAQItem
            question="How do I get paid?"
            answer="Connect your Stripe account in one click. Customers pay directly from the invoice with credit card or bank transfer. Funds arrive in 1-2 days."
          />
          <FAQItem
            question="Can I cancel anytime?"
            answer="Absolutely. No contracts, no cancellation fees. Your data is always yours to export."
          />
          <FAQItem
            question="Is my data secure?"
            answer="Yes. We use bank-level encryption, secure cloud storage, and never store payment information on our servers."
          />
          <FAQItem
            question="Do you offer support?"
            answer="Yes! Email support for all users, with priority support for Pro subscribers."
          />
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <Button variant="outline" size="lg">
            Contact Support
          </Button>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="bg-primary text-primary-foreground rounded-2xl md:rounded-3xl p-8 md:p-12 lg:p-16 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Ready to Get Paid Faster?
            </h2>
            <p className="text-lg sm:text-xl mb-8 opacity-90">
              Start creating professional invoices today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6 shadow-xl">
                <a href={getLoginUrl()}>
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
            <p className="text-sm opacity-75 pt-4">
              <CheckCircle className="inline h-4 w-4 mr-1" />
              No credit card required
              <span className="mx-2">•</span>
              <CheckCircle className="inline h-4 w-4 mr-1" />
              3 free invoices
              <span className="mx-2">•</span>
              <CheckCircle className="inline h-4 w-4 mr-1" />
              Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 mt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src="/SleekInvoices-Wide.svg" alt="SleekInvoices" className="h-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Professional invoicing made simple for freelancers and small businesses.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/landing" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/landing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/landing" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/landing" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/landing" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="/landing" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/landing" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/landing" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="/landing" className="hover:text-foreground transition-colors">API Docs</Link></li>
                <li><Link href="/landing" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 SleekInvoices. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
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
  iconColor 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  iconColor: string;
}) {
  return (
    <div className="group bg-card border border-border rounded-2xl p-8 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
      <div className={`inline-flex p-3 rounded-xl bg-secondary ${iconColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// Step Card Component
function StepCard({ 
  number, 
  title, 
  description, 
  icon 
}: { 
  number: string; 
  title: string; 
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
        {number}
      </div>
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-primary opacity-20">
        {icon}
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
    <div className={`relative bg-card border rounded-2xl p-6 md:p-8 transition-all duration-300 ${
      highlighted 
        ? "ring-2 ring-primary shadow-2xl shadow-primary/20 md:scale-105" 
        : "border-border hover:shadow-lg"
    }`}>
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full shadow-lg">
          {badge}
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      <div className="text-center mb-6">
        <span className="text-5xl font-bold text-foreground">{price}</span>
        <span className="text-muted-foreground ml-2">/{period}</span>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${highlighted ? 'text-primary' : 'text-green-500'}`} />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        asChild 
        className="w-full" 
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
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
      <h4 className="font-semibold text-foreground mb-2">{question}</h4>
      <p className="text-muted-foreground text-sm leading-relaxed">{answer}</p>
    </div>
  );
}
