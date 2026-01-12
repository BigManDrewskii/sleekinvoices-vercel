import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  /** Icon to display (fallback if no illustration) */
  icon?: LucideIcon;
  /** Custom illustration component or image URL - user will provide mascot */
  illustration?: React.ReactNode | string;
  /** Main title */
  title: string;
  /** Description text */
  description: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional className */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * EmptyState component for displaying when there's no data
 * 
 * Supports custom mascot illustrations via the `illustration` prop.
 * Pass either a React component or an image URL.
 * 
 * @example
 * // With custom illustration component
 * <EmptyState
 *   illustration={<MascotSleeping />}
 *   title="No invoices yet"
 *   description="Create your first invoice to get started"
 *   action={{ label: "Create Invoice", onClick: () => {} }}
 * />
 * 
 * @example
 * // With image URL
 * <EmptyState
 *   illustration="/mascot/empty-invoices.svg"
 *   title="No invoices yet"
 *   description="Create your first invoice to get started"
 * />
 */
export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      illustration: 'h-24 w-24',
      icon: 'h-10 w-10',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      illustration: 'h-32 w-32',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      illustration: 'h-48 w-48',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
    >
      {/* Illustration or Icon */}
      <div className="mb-6">
        {illustration ? (
          typeof illustration === 'string' ? (
            <img
              src={illustration}
              alt=""
              className={cn(sizes.illustration, 'object-contain')}
            />
          ) : (
            <div className={sizes.illustration}>{illustration}</div>
          )
        ) : Icon ? (
          <div className="rounded-full bg-muted p-4">
            <Icon className={cn(sizes.icon, 'text-muted-foreground')} />
          </div>
        ) : (
          // Placeholder for mascot - shows a subtle box where illustration will go
          <div
            className={cn(
              sizes.illustration,
              'rounded-2xl bg-muted/50 border-2 border-dashed border-muted-foreground/20',
              'flex items-center justify-center'
            )}
          >
            <span className="text-xs text-muted-foreground/50">
              Mascot
            </span>
          </div>
        )}
      </div>

      {/* Text Content */}
      <h3 className={cn('font-semibold text-foreground mb-2', sizes.title)}>
        {title}
      </h3>
      <p
        className={cn(
          'text-muted-foreground max-w-sm mb-6',
          sizes.description
        )}
      >
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button onClick={action.onClick} className="gap-2">
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Preset empty states for common scenarios
 * Now featuring Sleeky the otter mascot!
 */
export const EmptyStatePresets = {
  invoices: {
    illustration: '/sleeky/empty-states/invoices.png',
    title: 'No invoices yet',
    description: 'Create your first invoice to start tracking your revenue and getting paid faster.',
  },
  clients: {
    illustration: '/sleeky/empty-states/clients.png',
    title: 'No clients yet',
    description: 'Add your first client to start creating invoices and building relationships.',
  },
  expenses: {
    illustration: '/sleeky/empty-states/expenses.png',
    title: 'No expenses recorded',
    description: 'Track your business expenses to get a complete picture of your finances.',
  },
  estimates: {
    illustration: '/sleeky/empty-states/estimates.png',
    title: 'No estimates yet',
    description: 'Create estimates to send professional quotes to potential clients.',
  },
  payments: {
    illustration: '/sleeky/empty-states/payments.png',
    title: 'No payments recorded',
    description: 'Payments will appear here once your clients start paying their invoices.',
  },
  products: {
    illustration: '/sleeky/empty-states/products.png',
    title: 'No products or services',
    description: 'Add your products and services to quickly add them to invoices.',
  },
  templates: {
    illustration: '/sleeky/empty-states/analytics.png',
    title: 'No custom templates',
    description: 'Create custom invoice templates to match your brand.',
  },
  recurring: {
    illustration: '/sleeky/empty-states/invoices.png',
    title: 'No recurring invoices',
    description: 'Set up recurring invoices to automate billing for regular clients.',
  },
  search: {
    illustration: '/sleeky/empty-states/search-results.png',
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
  },
  emailHistory: {
    illustration: '/sleeky/empty-states/email-history.png',
    title: 'No emails sent yet',
    description: 'Email history will appear here once you start sending invoices to clients.',
  },
  analytics: {
    illustration: '/sleeky/empty-states/analytics.png',
    title: 'No data yet',
    description: 'Analytics will show once you have invoices and payments to analyze.',
  },
  subscriptionHistory: {
    illustration: '/sleeky/empty-states/subscription-history.png',
    title: 'No subscription history',
    description: 'Your subscription and payment history will appear here.',
  },
};
