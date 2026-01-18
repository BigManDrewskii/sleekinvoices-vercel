import * as React from "react";
import { ChevronUp, Info, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  disabledMessage?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
  className,
  disabled = false,
  disabledMessage,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-lg bg-card/50 border border-border/50",
        disabled && "opacity-60",
        className
      )}
    >
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-left rounded-t-lg transition-colors",
          disabled ? "cursor-not-allowed" : "hover:bg-muted/30"
        )}
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        <ChevronUp
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            !isOpen && "rotate-180"
          )}
        />
      </button>

      {disabled && disabledMessage && (
        <div className="px-4 pb-3 pt-0">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{disabledMessage}</p>
          </div>
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen && !disabled
            ? "max-h-[2000px] opacity-100"
            : "max-h-0 opacity-0"
        )}
      >
        <div
          className={cn("px-4 pb-4 pt-1", disabled && "pointer-events-none")}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readonly?: boolean;
  subtitle?: string;
}

export function ColorInput({
  label,
  value,
  onChange,
  readonly = false,
  subtitle,
}: ColorInputProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {subtitle && (
          <span className="text-xs text-muted-foreground font-normal">
            {subtitle}
          </span>
        )}
      </div>

      <div className="relative group">
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
            readonly
              ? "border-border bg-muted/30"
              : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
          )}
        >
          {/* Large Color Swatch */}
          <div className="relative">
            {readonly ? (
              <div
                className="w-12 h-12 rounded-lg border-2 border-border/50 shadow-sm"
                style={{ backgroundColor: value }}
              />
            ) : (
              <input
                type="color"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer shadow-sm border-2 border-border/50 hover:shadow-md hover:scale-105 transition-all"
                style={{ backgroundColor: value }}
              />
            )}
          </div>

          {/* Hex Input */}
          <input
            type="text"
            value={value}
            onChange={e => !readonly && onChange(e.target.value)}
            readOnly={readonly}
            className={cn(
              "flex-1 bg-transparent border-0 text-sm font-mono focus:outline-none",
              readonly ? "text-muted-foreground" : "text-foreground"
            )}
            placeholder="#000000"
            maxLength={7}
          />

          {/* Copy Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-8 w-8 shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
}: SliderInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-foreground">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="w-16 bg-muted/30 border border-border/50 rounded px-2 py-1 text-sm text-right font-mono focus:outline-none focus:border-primary"
          />
          {unit && (
            <span className="text-xs text-muted-foreground">{unit}</span>
          )}
        </div>
      </div>
      <input
        type="range"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-1.5 bg-muted/50 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background"
      />
    </div>
  );
}
