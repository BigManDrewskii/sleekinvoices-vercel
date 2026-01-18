import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

/**
 * Easing function for smooth animation
 * Uses ease-out-expo for snappy start, smooth finish
 */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Easing function for extra snappy animation
 * Uses ease-out-quart for quick acceleration
 */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  className?: string;
  easing?: "expo" | "quart";
}

/**
 * AnimatedNumber - Animates a number from 0 to target value
 * Uses requestAnimationFrame for smooth 60fps animation
 */
export function AnimatedNumber({
  value,
  duration = 800,
  delay = 0,
  decimals = 0,
  className,
  easing = "expo",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Skip animation if value is 0 or hasn't changed
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    // Only animate once on mount
    if (hasAnimated.current) {
      setDisplayValue(value);
      return;
    }

    const easingFn = easing === "expo" ? easeOutExpo : easeOutQuart;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current - delay;

      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      const currentValue = easedProgress * value;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        hasAnimated.current = true;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, delay, easing]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString();

  return (
    <span className={cn("font-numeric tabular-nums", className)}>
      {formatted}
    </span>
  );
}

interface AnimatedCurrencyProps {
  amount: number;
  currency?: string;
  duration?: number;
  delay?: number;
  className?: string;
  bold?: boolean;
  easing?: "expo" | "quart";
}

/**
 * AnimatedCurrency - Animates a currency value from 0 to target
 * Formats as currency during animation for consistent display
 */
export function AnimatedCurrency({
  amount,
  currency = "USD",
  duration = 800,
  delay = 0,
  className,
  bold = false,
  easing = "expo",
}: AnimatedCurrencyProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (amount === 0) {
      setDisplayValue(0);
      return;
    }

    if (hasAnimated.current) {
      setDisplayValue(amount);
      return;
    }

    const easingFn = easing === "expo" ? easeOutExpo : easeOutQuart;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current - delay;

      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      const currentValue = easedProgress * amount;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        hasAnimated.current = true;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [amount, duration, delay, easing]);

  return (
    <span
      className={cn(
        bold ? "font-numeric-bold" : "font-numeric",
        "tabular-nums",
        className
      )}
    >
      {formatCurrency(displayValue, currency)}
    </span>
  );
}

interface AnimatedIntegerProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  bold?: boolean;
  easing?: "expo" | "quart";
  suffix?: string;
  prefix?: string;
}

/**
 * AnimatedInteger - Animates an integer value with optional prefix/suffix
 * Perfect for counts, quantities, and whole number metrics
 */
export function AnimatedInteger({
  value,
  duration = 600,
  delay = 0,
  className,
  bold = false,
  easing = "quart",
  suffix = "",
  prefix = "",
}: AnimatedIntegerProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    if (hasAnimated.current) {
      setDisplayValue(value);
      return;
    }

    const easingFn = easing === "expo" ? easeOutExpo : easeOutQuart;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current - delay;

      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      const currentValue = Math.round(easedProgress * value);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        hasAnimated.current = true;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, delay, easing]);

  return (
    <span
      className={cn(
        bold ? "font-numeric-bold" : "font-numeric",
        "tabular-nums",
        className
      )}
    >
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  className?: string;
  showSign?: boolean;
  easing?: "expo" | "quart";
}

/**
 * AnimatedPercentage - Animates a percentage value
 * Optionally shows + sign for positive values
 */
export function AnimatedPercentage({
  value,
  duration = 600,
  delay = 0,
  decimals = 1,
  className,
  showSign = false,
  easing = "quart",
}: AnimatedPercentageProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    if (hasAnimated.current) {
      setDisplayValue(value);
      return;
    }

    const easingFn = easing === "expo" ? easeOutExpo : easeOutQuart;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current - delay;

      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      const currentValue = easedProgress * value;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        hasAnimated.current = true;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, delay, easing]);

  const sign = showSign && displayValue > 0 ? "+" : "";
  const formatted = `${sign}${displayValue.toFixed(decimals)}%`;

  return (
    <span className={cn("font-numeric tabular-nums", className)}>
      {formatted}
    </span>
  );
}
