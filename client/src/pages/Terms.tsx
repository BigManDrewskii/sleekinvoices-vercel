import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Matching Landing Page Style */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/10 rounded-full">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/landing" className="flex items-center gap-2.5">
              <img src="/monogram-white.svg" alt="SleekInvoices" className="h-8 w-8" />
              <span className="font-semibold text-foreground text-lg hidden sm:block">SleekInvoices</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/landing" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all">
                Home
              </Link>
              <Link href="/privacy" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all">
                Privacy
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="rounded-full hidden md:inline-flex">
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
              <Button size="sm" asChild className="rounded-full">
                <a href={getLoginUrl()}>
                  Get Started
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-28 pb-20">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: January 8, 2026</p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using SleekInvoices ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all visitors, 
                users, and others who access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                SleekInvoices is an online invoicing platform that allows users to create, manage, and send professional invoices. 
                The Service includes features such as invoice generation, client management, payment tracking, analytics, 
                and integrations with third-party services including QuickBooks Online.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To use certain features of the Service, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
                <li>Ensuring that your account information is accurate and up-to-date</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any harmful, threatening, or offensive content</li>
                <li>Attempt to gain unauthorized access to the Service or its systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use the Service for fraudulent purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Third-Party Integrations</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Service may integrate with third-party services, including but not limited to QuickBooks Online. 
                When you connect your account to a third-party service:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>You authorize us to access and sync data between the Service and the third-party service</li>
                <li>You are also bound by the third-party's terms of service and privacy policy</li>
                <li>We are not responsible for the availability or functionality of third-party services</li>
                <li>You may disconnect third-party integrations at any time through your account settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content, features, and functionality are owned by SleekInvoices and are 
                protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. 
                You retain ownership of any content you create using the Service, including invoices and client data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Payment Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                Certain features of the Service may require payment. By subscribing to a paid plan, you agree to pay 
                all applicable fees. Fees are non-refundable except as required by law or as explicitly stated in these Terms. 
                We reserve the right to change our pricing with reasonable notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Data and Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your use of the Service is also governed by our{" "}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, 
                which describes how we collect, use, and protect your personal information. By using the Service, 
                you consent to our data practices as described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed uppercase text-sm">
                The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. 
                We do not warrant that the Service will be uninterrupted, secure, or error-free. You use the Service at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed uppercase text-sm">
                To the maximum extent permitted by law, SleekInvoices shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly 
                or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, 
                for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease. 
                You may also terminate your account at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms 
                on this page and updating the "Last updated" date. Your continued use of the Service after any changes constitutes 
                acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us at{" "}
                <a href="mailto:support@sleekinvoices.com" className="text-primary hover:underline">support@sleekinvoices.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer - Matching Landing Page Style */}
      <footer className="relative mt-16">
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
                  <li><Link href="/landing" className="hover:text-foreground transition-colors">Features</Link></li>
                  <li><Link href="/landing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                  <li><Link href="/landing" className="hover:text-foreground transition-colors">FAQ</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-4 text-sm">Legal</h4>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li><Link href="/terms" className="hover:text-foreground transition-colors text-primary">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-4 text-sm">Get Started</h4>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li><a href={getLoginUrl()} className="hover:text-foreground transition-colors">Sign In</a></li>
                  <li><a href={getLoginUrl()} className="hover:text-foreground transition-colors">Create Account</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">© 2026 SleekInvoices. All rights reserved.</p>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
