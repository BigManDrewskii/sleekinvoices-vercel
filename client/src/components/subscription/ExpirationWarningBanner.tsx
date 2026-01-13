import { AlertTriangle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useState } from 'react';

interface ExpirationWarningBannerProps {
  daysRemaining: number;
  timeRemaining: string;
  effectiveEndDate: Date | string | null;
}

export function ExpirationWarningBanner({
  daysRemaining,
  timeRemaining,
  effectiveEndDate,
}: ExpirationWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if dismissed or more than 7 days remaining
  if (dismissed || daysRemaining > 7 || daysRemaining <= 0) {
    return null;
  }

  const formattedDate = effectiveEndDate
    ? new Date(effectiveEndDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'soon';

  const isUrgent = daysRemaining <= 3;
  const bgColor = isUrgent ? 'bg-destructive/10 border-destructive/30' : 'bg-amber-500/10 border-amber-500/30';
  const textColor = isUrgent ? 'text-destructive' : 'text-amber-400';
  const iconColor = isUrgent ? 'text-destructive' : 'text-amber-500';

  return (
    <div className={`relative rounded-lg border ${bgColor} p-4 mb-6`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${iconColor}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${textColor}`}>
            {isUrgent ? 'Subscription Expiring Soon!' : 'Subscription Expiring'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your Pro subscription will expire on <span className="font-medium text-foreground">{formattedDate}</span>.
            {' '}
            <span className={`font-medium ${textColor}`}>
              {timeRemaining}
            </span>
          </p>
          
          <div className="mt-3 flex items-center gap-3">
            <Link href="/subscription">
              <Button size="sm" variant="default" className="bg-primary hover:bg-primary/90">
                <Clock className="h-4 w-4 mr-2" />
                Extend Now
              </Button>
            </Link>
            <span className="text-xs text-muted-foreground">
              Save up to 29% with crypto
            </span>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </div>
  );
}
