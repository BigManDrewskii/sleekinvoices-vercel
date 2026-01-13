import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PlayCircle } from "lucide-react";

export function DemoVideoSection() {
  return (
    <section className="py-16 md:py-20 border-y border-border/50">
      <div className="container max-w-5xl mx-auto px-6">
        {/* Video Placeholder Container */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-card border border-border shadow-lg">
          {/* 16:9 Aspect Ratio */}
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            {/* Placeholder Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-background via-background/95 to-primary/5">
              {/* Sleeky Illustration */}
              <div className="mb-6">
                <img
                  src="/sleeky.svg"
                  alt="Sleeky"
                  className="h-32 sm:h-40 md:h-48 mx-auto opacity-95 sleeky-float"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="text-center max-w-md mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <PlayCircle className="h-4 w-4" />
                  Coming Soon
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                  Demo Video Coming Soon!
                </h3>

                <p className="text-base text-muted-foreground mb-6">
                  We're creating a walkthrough video to show you exactly how
                  SleekInvoices works. In the meantime, check out our
                  comprehensive guide.
                </p>

                {/* CTA Button */}
                <Button size="lg" asChild className="rounded-full">
                  <Link href="/docs">
                    See How It Works
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Optional: Small caption below video */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          Learn how to create professional invoices in under 60 seconds
        </p>
      </div>
    </section>
  );
}
