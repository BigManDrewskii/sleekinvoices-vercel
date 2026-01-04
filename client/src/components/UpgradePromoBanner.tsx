/**
 * UpgradePromoBanner Component
 * 
 * Eye-catching promotional banner to encourage Pro upgrades
 * Features gradient design, benefits list, and compelling CTA
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Zap, Crown, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function UpgradePromoBanner() {
  const { data: usage } = trpc.subscription.getUsage.useQuery();

  // Don't show for Pro users
  if (usage?.isPro) {
    return null;
  }

  const benefits = [
    "Unlimited invoices",
    "Stripe payment links",
    "Email reminders",
    "Advanced analytics",
  ];

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left side: Content */}
          <div className="flex-1 space-y-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Crown className="h-4 w-4" />
              <span>Limited Time Offer</span>
            </div>

            {/* Heading */}
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Upgrade to Pro
              </h3>
              <p className="text-muted-foreground text-base">
                Unlock unlimited invoicing and premium features for just $12/month
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
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
              <Link href="/subscription" className="flex items-center gap-2">
                <Zap className="h-5 w-5 group-hover:scale-110 transition-transform" />
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
