import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

export default function Privacy() {
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
              <Link href="/terms" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all">
                Terms
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
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 8, 2026</p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                SleekInvoices ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information when you use our invoicing platform and services 
                ("Service"). Please read this policy carefully to understand our practices regarding your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Account Information:</strong> Name, email address, and authentication credentials when you create an account</li>
                <li><strong className="text-foreground">Business Information:</strong> Company name, address, logo, and tax identification numbers</li>
                <li><strong className="text-foreground">Client Data:</strong> Names, email addresses, and contact information of your clients</li>
                <li><strong className="text-foreground">Invoice Data:</strong> Invoice details, line items, amounts, and payment information</li>
                <li><strong className="text-foreground">Payment Information:</strong> Billing details processed through our payment providers (Stripe)</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">2.2 Information Collected Automatically</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Usage Data:</strong> Pages visited, features used, and actions taken within the Service</li>
                <li><strong className="text-foreground">Device Information:</strong> Browser type, operating system, and device identifiers</li>
                <li><strong className="text-foreground">Log Data:</strong> IP addresses, access times, and referring URLs</li>
                <li><strong className="text-foreground">Cookies:</strong> Session cookies and authentication tokens to maintain your login state</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">2.3 Information from Third-Party Integrations</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                When you connect third-party services like QuickBooks Online, we may receive:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>OAuth tokens to maintain the connection (we do not store your QuickBooks password)</li>
                <li>Company information from your QuickBooks account</li>
                <li>Customer and invoice data necessary for synchronization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">We use the collected information to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process invoices and manage your client relationships</li>
                <li>Synchronize data with connected third-party services (e.g., QuickBooks)</li>
                <li>Send transactional emails (invoice notifications, payment confirmations)</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Detect and prevent fraud or security issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">We may share your information with:</p>
              
              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">4.1 Service Providers</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Third-party companies that help us operate the Service, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Stripe:</strong> Payment processing</li>
                <li><strong className="text-foreground">Cloud hosting providers:</strong> Data storage and infrastructure</li>
                <li><strong className="text-foreground">Email service providers:</strong> Transactional email delivery</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">4.2 Third-Party Integrations</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you authorize integrations (such as QuickBooks Online), we share necessary data to enable synchronization. 
                You control these connections and can disconnect them at any time from your Settings page.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3 mt-6">4.3 Legal Requirements</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may disclose information if required by law, court order, or government request, or to protect our rights, 
                property, or safety.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. QuickBooks Integration</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you connect SleekInvoices to QuickBooks Online:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>We use OAuth 2.0 for secure authentication — we never see or store your QuickBooks password</li>
                <li>We access only the data necessary for invoice and customer synchronization</li>
                <li>Data flows one-way from SleekInvoices to QuickBooks (we push invoices and customers)</li>
                <li>You can disconnect the integration at any time, which revokes our access</li>
                <li>Your QuickBooks data is also subject to <a href="https://www.intuit.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Intuit's Privacy Policy</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>All data is transmitted over HTTPS/TLS encryption</li>
                <li>OAuth tokens are stored securely and encrypted at rest</li>
                <li>Access to production systems is restricted and logged</li>
                <li>Regular security assessments and updates</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, 
                we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your data for as long as your account is active or as needed to provide the Service. 
                If you delete your account, we will delete or anonymize your personal data within 30 days, 
                except where we are required to retain it for legal or legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Your Rights (GDPR & CCPA)</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong className="text-foreground">Access:</strong> Request a copy of your personal data</li>
                <li><strong className="text-foreground">Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong className="text-foreground">Erasure:</strong> Request deletion of your personal data</li>
                <li><strong className="text-foreground">Portability:</strong> Receive your data in a portable format</li>
                <li><strong className="text-foreground">Objection:</strong> Object to certain processing of your data</li>
                <li><strong className="text-foreground">Restriction:</strong> Request limited processing of your data</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise these rights, please contact us at{" "}
                <a href="mailto:privacy@sleekinvoices.com" className="text-primary hover:underline">privacy@sleekinvoices.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use essential cookies to maintain your session and authentication state. These cookies are necessary 
                for the Service to function properly. We do not use tracking or advertising cookies. 
                You can configure your browser to refuse cookies, but this may affect your ability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is not intended for users under 18 years of age. We do not knowingly collect personal 
                information from children. If we become aware that we have collected data from a child, 
                we will take steps to delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data may be transferred to and processed in countries other than your own. We ensure appropriate 
                safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                posting the new policy on this page and updating the "Last updated" date. We encourage you to review 
                this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="p-6 bg-card/50 border border-border rounded-xl">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Email:</strong>{" "}
                  <a href="mailto:privacy@sleekinvoices.com" className="text-primary hover:underline">privacy@sleekinvoices.com</a>
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong className="text-foreground">Website:</strong>{" "}
                  <a href="https://sleekinvoices.com" className="text-primary hover:underline">https://sleekinvoices.com</a>
                </p>
              </div>
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
                  <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="hover:text-foreground transition-colors text-primary">Privacy Policy</Link></li>
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
