import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium",
    "transition-all duration-150 ease-out",
    "transform-gpu will-change-transform",
    "active:scale-[0.98] active:transition-none",
    "disabled:pointer-events-none disabled:opacity-40 disabled:scale-100",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "[&_svg]:transition-transform [&_svg]:duration-150",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
    "select-none cursor-pointer",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary - subtle border accent on hover
        default: [
          "bg-primary text-primary-foreground",
          "border border-primary",
          "hover:bg-primary/90 hover:border-primary/70",
          "active:bg-primary/80",
        ].join(" "),
        // Secondary - muted fill with border reveal
        secondary: [
          "bg-secondary text-secondary-foreground",
          "border border-transparent",
          "hover:bg-secondary/80 hover:border-border/50",
          "active:bg-secondary/70",
        ].join(" "),
        // Outline - border emphasis on hover
        outline: [
          "border border-border bg-transparent text-foreground",
          "hover:border-muted-foreground/50 hover:bg-secondary/30",
          "active:bg-secondary/50",
        ].join(" "),
        // Ghost - minimal with subtle background
        ghost: [
          "bg-transparent text-muted-foreground",
          "border border-transparent",
          "hover:text-foreground hover:bg-secondary/50",
          "active:bg-secondary/70",
        ].join(" "),
        // Destructive - subtle red outline accent
        destructive: [
          "bg-destructive text-destructive-foreground",
          "border border-destructive",
          "hover:bg-destructive/90 hover:border-destructive/70",
          "active:bg-destructive/80",
        ].join(" "),
        // Soft - very muted background
        soft: [
          "bg-muted/50 text-muted-foreground",
          "border border-transparent",
          "hover:text-foreground hover:bg-muted/80 hover:border-border/30",
          "active:bg-muted",
        ].join(" "),
        // Link - underline animation
        link: [
          "bg-transparent text-primary p-0 h-auto border-none",
          "underline-offset-4 decoration-primary/0 hover:decoration-primary hover:underline",
          "active:text-primary/80",
        ].join(" "),
        // Success - green with outline accent
        success: [
          "bg-green-600 text-white",
          "border border-green-600",
          "hover:bg-green-600/90 hover:border-green-500",
          "active:bg-green-600/80",
        ].join(" "),
        // Crypto - distinctive amber/orange for crypto payments
        crypto: "bg-[var(--color-crypto)]/10 text-[var(--color-crypto)] border border-[var(--color-crypto)]/40 hover:bg-[var(--color-crypto)]/20 hover:border-[var(--color-crypto)]/70 active:bg-[var(--color-crypto)]/30",
        // Premium outline - subtle primary border variant
        "outline-primary": [
          "border border-primary/40 bg-transparent text-primary",
          "hover:border-primary/70 hover:bg-primary/5",
          "active:bg-primary/10",
        ].join(" "),
      },
      size: {
        default: "h-9 px-4 py-2 rounded-lg",
        sm: "h-8 px-3 py-1.5 text-xs rounded-md",
        lg: "h-11 px-6 py-2.5 text-base rounded-lg",
        xl: "h-12 px-8 py-3 text-base rounded-xl",
        icon: "size-9 rounded-lg",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
