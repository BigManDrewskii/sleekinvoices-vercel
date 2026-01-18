import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface CurrencyInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string | number;
  onValueChange?: (value: string) => void;
  currency?: string;
}

/**
 * Currency input with symbol prefix
 * Automatically shows $ or currency code
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    { value, onValueChange, onChange, currency = "USD", className, ...props },
    ref
  ) => {
    const symbol = currency === "USD" ? "$" : currency;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value);
      onChange?.(e);
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-numeric">
          {symbol}
        </span>
        <Input
          ref={ref}
          type="number"
          step="0.01"
          value={value}
          onChange={handleChange}
          className={cn("pl-8 font-numeric", className)}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

interface PercentageInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string | number;
  onValueChange?: (value: string) => void;
}

/**
 * Percentage input with % suffix and automatic validation (0-100)
 */
export const PercentageInput = forwardRef<
  HTMLInputElement,
  PercentageInputProps
>(({ value, onValueChange, onChange, className, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.value);
    onChange?.(e);
  };

  return (
    <div className="relative">
      <Input
        ref={ref}
        type="number"
        step="0.01"
        min="0"
        max="100"
        value={value}
        onChange={handleChange}
        className={cn("pr-8 font-numeric", className)}
        {...props}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-numeric">
        %
      </span>
    </div>
  );
});

PercentageInput.displayName = "PercentageInput";

interface QuantityInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string | number;
  onValueChange?: (value: string) => void;
}

/**
 * Quantity input for line items
 * Numeric input with monospace font
 */
export const QuantityInput = forwardRef<HTMLInputElement, QuantityInputProps>(
  ({ value, onValueChange, onChange, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value);
      onChange?.(e);
    };

    return (
      <Input
        ref={ref}
        type="number"
        step="1"
        min="0"
        value={value}
        onChange={handleChange}
        className={cn("font-numeric", className)}
        {...props}
      />
    );
  }
);

QuantityInput.displayName = "QuantityInput";
