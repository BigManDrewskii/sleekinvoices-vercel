import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Zap,
  Crown,
  Check,
  Loader2,
  Plus,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreditTopUpProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreditTopUp({ trigger, onSuccess }: CreditTopUpProps) {
  const [open, setOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);

  const { data: credits, refetch: refetchCredits } =
    trpc.ai.getCredits.useQuery();
  const { data: packs } = trpc.ai.getCreditPacks.useQuery();
  const { data: purchaseHistory } = trpc.ai.getPurchaseHistory.useQuery();

  const purchaseMutation = trpc.ai.createCreditPurchase.useMutation({
    onSuccess: data => {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    },
    onError: error => {
      toast.error(error.message || "Failed to create checkout session");
      setSelectedPack(null);
    },
  });

  const handlePurchase = (packType: string) => {
    setSelectedPack(packType);
    purchaseMutation.mutate({
      packType: packType as "starter" | "standard" | "pro_pack",
    });
  };

  const packIcons: Record<string, typeof Sparkles> = {
    starter: Sparkles,
    standard: Zap,
    pro_pack: Crown,
  };

  const packColors: Record<string, string> = {
    starter: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    standard: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    pro_pack: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Plus className="h-4 w-4" />
      Get More Credits
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Get More AI Credits
          </DialogTitle>
          <DialogDescription>
            Purchase additional credits to continue using AI features. Credits
            are added to your current month's balance.
          </DialogDescription>
        </DialogHeader>

        {/* Current Balance */}
        {credits && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold">{credits.remaining} credits</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{credits.used} used this month</p>
              <p>
                {credits.limit} base + {credits.purchased} purchased
              </p>
            </div>
          </div>
        )}

        {/* Credit Packs */}
        <div className="grid gap-4 py-4">
          {packs?.map(pack => {
            const Icon = packIcons[pack.id] || Sparkles;
            const colorClass = packColors[pack.id] || packColors.starter;
            const isPopular = pack.id === "standard";
            const isPurchasing =
              selectedPack === pack.id && purchaseMutation.isPending;

            return (
              <Card
                key={pack.id}
                className={cn(
                  "relative cursor-pointer transition-all hover:shadow-md",
                  "bg-gradient-to-br border-2",
                  colorClass,
                  selectedPack === pack.id && "ring-2 ring-primary"
                )}
                onClick={() =>
                  !purchaseMutation.isPending && handlePurchase(pack.id)
                }
              >
                {isPopular && (
                  <Badge className="absolute -top-2 right-4 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-background/80 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{pack.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pack.credits} credits • $
                        {(pack.pricePerCredit * 100).toFixed(1)}¢ each
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      ${pack.price.toFixed(2)}
                    </p>
                    <Button
                      size="sm"
                      className="mt-2"
                      disabled={purchaseMutation.isPending}
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Buy Now"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Credits never expire within the month</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Use for Smart Compose & AI Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Secure payment via Stripe</span>
          </div>
        </div>

        {/* Purchase History */}
        {purchaseHistory && purchaseHistory.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Recent Purchases</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {purchaseHistory.slice(0, 3).map(purchase => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
                >
                  <div>
                    <span className="font-medium">
                      {purchase.creditsAmount} credits
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge
                    variant={
                      purchase.status === "completed" ? "default" : "secondary"
                    }
                  >
                    {purchase.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inline credit top-up prompt shown when user is low on credits
 */
export function LowCreditsPrompt({ className }: { className?: string }) {
  const { data: credits } = trpc.ai.getCredits.useQuery();

  if (!credits || credits.remaining > 3) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg",
        "bg-amber-500/10 border border-amber-500/30",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <span className="text-sm">
          {credits.remaining === 0
            ? "You're out of AI credits"
            : `Only ${credits.remaining} credits left`}
        </span>
      </div>
      <CreditTopUp
        trigger={
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-amber-500/50 hover:bg-amber-500/10"
          >
            <Plus className="h-3.5 w-3.5" />
            Top Up
          </Button>
        }
      />
    </div>
  );
}
