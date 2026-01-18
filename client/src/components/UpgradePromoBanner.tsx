/**
 * UpgradePromoBanner Component
 *
 * Eye-catching promotional banner to encourage Pro upgrades
 * Features gradient design, benefits list, and compelling CTA
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function UpgradePromoBanner() {
  const { data: usage, isLoading } = trpc.subscription.getUsage.useQuery();

  // Don't show while loading (prevents flash) or for Pro users
  if (isLoading || usage?.isPro) {
    return null;
  }

  const benefits = [
    "Unlimited invoices",
    "Stripe payment links",
    "Email reminders",
    "Advanced analytics",
  ];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left side: Content */}
          <div className="flex-1 space-y-4">
            {/* Heading */}
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Upgrade to Pro
              </h3>
              <p className="text-muted-foreground text-base">
                Unlock unlimited invoicing and premium features for just
                $12/month
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-foreground/90">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side: CTA */}
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <Button
              asChild
              size="lg"
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              <Link href="/subscription">
                <span className="font-semibold">Upgrade Now</span>
              </Link>
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime • No hidden fees
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
