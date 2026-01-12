import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Refund Policy
          </h1>
          <p className="text-muted-foreground text-lg">
            Last updated: January 12, 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>30-Day Money-Back Guarantee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We stand behind the quality of SleekInvoices. If you're not completely satisfied
                with your subscription within the first 30 days, we'll provide a full refund—no
                questions asked.
              </p>
              <p className="font-medium text-foreground">
                To request a refund during your first 30 days:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Contact our support team at{" "}
                  <a href="mailto:support@sleekinvoices.com" className="text-primary hover:underline">
                    support@sleekinvoices.com
                  </a>
                </li>
                <li>Include your account email and reason for cancellation (optional)</li>
                <li>Refunds are typically processed within 5-7 business days</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pro-Rated Refunds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                If you cancel your subscription after the initial 30-day period, you may be
                eligible for a pro-rated refund based on the unused portion of your subscription period.
              </p>

              <div className="bg-muted/50 rounded-lg p-4 my-4">
                <p className="font-medium text-foreground mb-2">Eligibility Criteria:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Annual subscriptions: Pro-rated refunds available for unused months</li>
                  <li>Monthly subscriptions: No refund for the current billing cycle</li>
                  <li>Service disruptions caused by us may qualify for credit or refund</li>
                  <li>Refund requests must be made within 90 days of the charge</li>
                </ul>
              </div>

              <p>
                Pro-rated refunds are calculated based on the number of complete months remaining
                in your subscription period at the time of cancellation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>One-Time Purchases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                AI credit purchases and other one-time transactions are generally non-refundable
                once processed, except in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Duplicate charges due to technical errors</li>
                <li>Unauthorized charges (subject to verification)</li>
                <li>Service unavailability preventing credit usage</li>
              </ul>
              <p className="mt-4">
                If you believe you qualify for a refund on a one-time purchase, please contact
                support within 14 days of the transaction with details about the issue.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Cancellation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                You can cancel your subscription at any time from your account settings. When you
                cancel:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You'll retain access until the end of your current billing period</li>
                <li>No further charges will be made after cancellation</li>
                <li>Your data will be retained for 90 days in case you wish to reactivate</li>
                <li>Export your data before cancellation if you need a permanent copy</li>
              </ul>
              <p className="mt-4 italic">
                Note: Canceling during the first 30 days qualifies for our money-back guarantee
                (see above).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crypto Payment Refunds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Subscriptions paid via cryptocurrency follow the same refund policy as credit card
                payments. However, please note:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Refunds are issued in the original cryptocurrency when possible</li>
                <li>Exchange rate fluctuations are not compensated</li>
                <li>Network transaction fees are non-refundable</li>
                <li>Processing may take 7-14 days due to blockchain confirmation times</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exceptions & Limitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p className="font-medium text-foreground">
                Refunds will not be provided in the following cases:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account suspension or termination due to Terms of Service violations</li>
                <li>Failure to cancel before the renewal date</li>
                <li>Change of mind after the 30-day guarantee period (use cancellation instead)</li>
                <li>Requests made more than 90 days after the charge</li>
                <li>Services already consumed or delivered</li>
              </ul>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-6">
                <p className="font-medium text-amber-600 dark:text-amber-400 mb-2">
                  Maximum Refund Cap
                </p>
                <p>
                  In accordance with our Terms of Service, refunds are limited to a maximum of
                  three months' fees or charges, regardless of subscription length or payment
                  amount.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Request a Refund</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                To request a refund, please follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-3 ml-4">
                <li>
                  <span className="font-medium text-foreground">Contact Support:</span> Email us at{" "}
                  <a href="mailto:support@sleekinvoices.com" className="text-primary hover:underline">
                    support@sleekinvoices.com
                  </a>
                </li>
                <li>
                  <span className="font-medium text-foreground">Provide Details:</span> Include your
                  account email, transaction ID, and reason for the refund request
                </li>
                <li>
                  <span className="font-medium text-foreground">Response Time:</span> We'll review your
                  request within 2-3 business days
                </li>
                <li>
                  <span className="font-medium text-foreground">Processing:</span> Approved refunds are
                  processed within 5-7 business days to your original payment method
                </li>
              </ol>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
                <p className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                  Need Help?
                </p>
                <p>
                  If you're experiencing issues with SleekInvoices, please reach out to our support
                  team before requesting a refund. We're here to help resolve any problems and ensure
                  you have the best experience possible.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We may update this Refund Policy from time to time. Any changes will be posted on
                this page with an updated "Last updated" date. Continued use of SleekInvoices after
                changes constitutes acceptance of the updated policy.
              </p>
              <p className="mt-4">
                For significant changes that may affect your rights, we'll notify active subscribers
                via email at least 30 days before the changes take effect.
              </p>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Questions About Refunds?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you have any questions about our refund policy or need assistance with a refund
                request, please don't hesitate to contact us:
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Email:</span>
                  <a href="mailto:support@sleekinvoices.com" className="text-primary hover:underline">
                    support@sleekinvoices.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">General Inquiries:</span>
                  <a href="mailto:hello@sleekinvoices.com" className="text-primary hover:underline">
                    hello@sleekinvoices.com
                  </a>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                We're committed to fair and transparent billing practices, and we're here to help
                resolve any concerns you may have.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-6 border-t border-border">
          <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
            <Link href="/terms">
              <a className="hover:text-foreground transition-colors">Terms of Service</a>
            </Link>
            <span>•</span>
            <Link href="/privacy">
              <a className="hover:text-foreground transition-colors">Privacy Policy</a>
            </Link>
            <span>•</span>
            <Link href="/">
              <a className="hover:text-foreground transition-colors">Back to App</a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
