import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GoogleFont,
  POPULAR_FONTS,
  FONT_WEIGHTS,
  loadGoogleFont,
  getAvailableWeights,
  searchFonts,
  filterFontsByCategory,
  FontWeight,
} from "@/lib/google-fonts";

interface GoogleFontPickerProps {
  value: string;
  weight?: number;
  onFontChange: (font: string) => void;
  onWeightChange?: (weight: number) => void;
  showWeightPicker?: boolean;
  placeholder?: string;
  className?: string;
  previewType?: "heading" | "body";
}

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "sans-serif", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "display", label: "Display" },
  { value: "monospace", label: "Mono" },
] as const;

/**
 * Elegant Typography Preview Component
 * Responsive preview that adapts to container size
 */
function ElegantTypographyPreview({
  font,
  weight,
  type,
  isHovering,
}: {
  font: string;
  weight: number;
  type: "heading" | "body";
  isHovering?: boolean;
}) {
  const fontStyle = { fontFamily: `"${font}", sans-serif`, fontWeight: weight };

  if (type === "heading") {
    return (
      <div className="space-y-4 md:space-y-6">
        {/* Large Aa Display */}
        <div className="flex flex-col items-center py-4 md:py-6">
          <span
            className={cn(
              "text-5xl md:text-6xl lg:text-7xl font-semibold text-foreground leading-none transition-all duration-300",
              isHovering && "scale-105"
            )}
            style={fontStyle}
          >
            Aa
          </span>
          <div className="mt-3 md:mt-4 text-xs text-muted-foreground font-mono tabular-nums">
            {weight}
          </div>
        </div>

        {/* Refined Alphabet Preview */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div
              className="text-sm md:text-base tracking-[0.02em] text-foreground/90 text-center"
              style={fontStyle}
            >
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </div>
            <div
              className="text-xs md:text-sm tracking-[0.01em] text-muted-foreground/80 text-center"
              style={fontStyle}
            >
              abcdefghijklmnopqrstuvwxyz
            </div>
            <div
              className="text-xs tabular-nums text-muted-foreground/70 text-center"
              style={fontStyle}
            >
              0123456789
            </div>
          </div>
        </div>

        {/* Sample Text */}
        <div className="space-y-1 pt-3 border-t border-border/50">
          <p
            className="text-xs md:text-sm text-foreground/70 text-center leading-relaxed"
            style={fontStyle}
          >
            The quick brown fox jumps over the lazy dog
          </p>
        </div>
      </div>
    );
  }

  // Body font preview
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Large Aa Display */}
      <div className="flex flex-col items-center py-4 md:py-6">
        <span
          className={cn(
            "text-5xl md:text-6xl lg:text-7xl font-normal text-foreground leading-none transition-all duration-300",
            isHovering && "scale-105"
          )}
          style={fontStyle}
        >
          Aa
        </span>
        <div className="mt-3 md:mt-4 text-xs text-muted-foreground font-mono tabular-nums">
          {weight}
        </div>
      </div>

      {/* Sample Paragraphs */}
      <div className="space-y-3">
        <p
          className="text-xs md:text-sm text-foreground/80 leading-relaxed"
          style={fontStyle}
        >
          The quick brown fox jumps over the lazy dog. Pack my box with five
          dozen liquor jugs.
        </p>
        <p
          className="text-[10px] md:text-xs text-muted-foreground/70 leading-relaxed"
          style={fontStyle}
        >
          Professional typography establishes hierarchy and guides the reader.
        </p>
      </div>

      {/* Invoice Style Numbers */}
      <div className="space-y-1.5 pt-3 border-t border-border/50">
        <div
          className="flex items-center justify-between text-xs md:text-sm"
          style={fontStyle}
        >
          <span className="text-muted-foreground/70">Subtotal</span>
          <span className="tabular-nums text-foreground/80">$1,234.56</span>
        </div>
        <div
          className="flex items-center justify-between text-sm md:text-base font-medium pt-1.5 border-t border-border/50"
          style={fontStyle}
        >
          <span className="text-foreground/90">Total</span>
          <span className="tabular-nums text-foreground">$1,333.32</span>
        </div>
      </div>
    </div>
  );
}

export function GoogleFontPicker({
  value,
  weight = 400,
  onFontChange,
  onWeightChange,
  showWeightPicker = true,
  placeholder = "Select font...",
  className,
  previewType = "heading",
}: GoogleFontPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [weightOpen, setWeightOpen] = useState(false);
  const [hoveredFont, setHoveredFont] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Find the currently selected font
  const selectedFont = useMemo(() => {
    return POPULAR_FONTS.find(f => f.family === value);
  }, [value]);

  // Get available weights for selected font
  const availableWeights = useMemo(() => {
    if (!selectedFont)
      return FONT_WEIGHTS.filter(w => w.value === 400 || w.value === 700);
    return getAvailableWeights(selectedFont);
  }, [selectedFont]);

  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    let fonts = POPULAR_FONTS;

    if (category !== "all") {
      fonts = filterFontsByCategory(category as GoogleFont["category"], fonts);
    }

    if (search) {
      fonts = searchFonts(search, fonts);
    }

    return fonts;
  }, [search, category]);

  // Load the selected font
  useEffect(() => {
    if (value) {
      loadGoogleFont(value, ["300", "400", "500", "600", "700"]);
    }
  }, [value]);

  // Load fonts as they appear in the list (for preview)
  const loadFontForPreview = useCallback((family: string) => {
    loadGoogleFont(family, ["400", "600", "700"]);
    setHoveredFont(family);
  }, []);

  const handleSelectFont = (font: GoogleFont) => {
    onFontChange(font.family);
    loadGoogleFont(font.family, ["300", "400", "500", "600", "700"]);
    setOpen(false);
    setSearch("");
    setHoveredFont(null);
  };

  const handleSelectWeight = (w: FontWeight) => {
    onWeightChange?.(w.value);
    setWeightOpen(false);
  };

  const currentWeight =
    availableWeights.find(w => w.value === weight) ||
    availableWeights.find(w => w.value === 400);

  // Determine which font to show in preview
  const previewFont = hoveredFont || value || "Inter";

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Font Family Picker */}
      <Popover
        open={open}
        onOpenChange={isOpen => {
          setOpen(isOpen);
          if (!isOpen) {
            setHoveredFont(null);
            setSearch("");
            setCategory("all");
            setShowPreview(false);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between font-normal h-9"
            style={{ fontFamily: value || "inherit" }}
          >
            <span className="truncate text-sm">{value || placeholder}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-2rem)] sm:w-[500px] md:w-[600px] lg:w-[700px] p-0 shadow-xl"
          align="start"
          sideOffset={8}
        >
          <div className="flex flex-col md:flex-row max-h-[70vh] md:max-h-[600px]">
            {/* Font List */}
            <div className="flex-1 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-border/50 bg-muted/5">
              {/* Search Header */}
              <div className="p-3 md:p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    placeholder="Search fonts..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm bg-background/50 border-border/50 focus-visible:ring-1"
                    autoFocus
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <div className="px-2 md:px-3 py-2 border-b border-border/50 bg-background/30 shrink-0">
                <div className="flex flex-wrap gap-1 md:gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        "px-2 md:px-3 py-1 md:py-1.5 text-[11px] md:text-xs rounded-md font-medium transition-all duration-200 touch-manipulation",
                        category === cat.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Preview Toggle */}
              <div className="md:hidden px-3 py-2 border-b border-border/50 bg-muted/10 shrink-0">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full px-3 py-2 text-xs font-medium text-muted-foreground bg-background/50 rounded-md border border-border/50 hover:bg-background transition-colors"
                >
                  {showPreview ? "Show Font List" : "Show Preview"}
                </button>
              </div>

              {/* Font List - Hidden on mobile when preview is shown */}
              <ScrollArea
                className={cn(
                  "flex-1 min-h-0",
                  showPreview && "hidden md:block"
                )}
              >
                <div className="p-2">
                  {filteredFonts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted/30 flex items-center justify-center mb-2 md:mb-3">
                        <Search className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground/50" />
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        No fonts found
                      </p>
                      <p className="text-[10px] md:text-xs text-muted-foreground/60 mt-1">
                        Try a different search
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {filteredFonts.map(font => (
                        <button
                          key={font.family}
                          onClick={() => handleSelectFont(font)}
                          onMouseEnter={() => loadFontForPreview(font.family)}
                          onMouseLeave={() => setHoveredFont(null)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 md:py-2.5 rounded-lg text-left transition-all duration-200 group touch-manipulation",
                            value === font.family
                              ? "bg-primary/10 text-primary shadow-sm"
                              : hoveredFont === font.family
                                ? "bg-muted/60 text-foreground shadow-sm"
                                : "text-foreground/70 hover:bg-muted/40 hover:text-foreground active:bg-muted/60"
                          )}
                        >
                          <span
                            className="text-sm md:text-base truncate transition-all"
                            style={{
                              fontFamily: `"${font.family}", ${font.category}`,
                            }}
                          >
                            {font.family}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {value === font.family && (
                              <div className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/20">
                                <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-primary" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Font Count Footer */}
              <div
                className={cn(
                  "px-3 md:px-4 py-2 border-t border-border/50 bg-muted/10 shrink-0",
                  showPreview && "hidden md:block"
                )}
              >
                <p className="text-[10px] md:text-xs text-muted-foreground/70 text-center font-medium">
                  {filteredFonts.length}{" "}
                  {filteredFonts.length === 1 ? "font" : "fonts"}
                  {search && " matching"}
                </p>
              </div>
            </div>

            {/* Typography Preview - Side panel on desktop, toggle on mobile */}
            <div
              className={cn(
                "flex-1 bg-gradient-to-br from-background via-muted/5 to-muted/10 p-4 md:p-6 overflow-y-auto",
                !showPreview && "hidden md:block",
                "md:max-w-[280px] lg:max-w-[320px]"
              )}
            >
              {/* Preview Header */}
              <div className="flex flex-col gap-2 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-border/50 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Preview
                  </span>
                  {hoveredFont && (
                    <span className="text-[10px] md:text-xs text-primary font-medium animate-in fade-in slide-in-from-right-2 duration-200">
                      Hover
                    </span>
                  )}
                </div>
                {(hoveredFont || value) && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs md:text-sm font-medium text-foreground truncate">
                      {hoveredFont || value}
                    </span>
                  </div>
                )}
              </div>

              {/* Preview Content */}
              <ElegantTypographyPreview
                font={previewFont}
                weight={weight}
                type={previewType}
                isHovering={!!hoveredFont}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Weight Picker */}
      {showWeightPicker && (
        <Popover open={weightOpen} onOpenChange={setWeightOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={weightOpen}
              className="w-[100px] md:w-[120px] justify-between h-9 shrink-0"
            >
              <span className="truncate text-xs md:text-sm">
                {currentWeight?.label || "Regular"}
              </span>
              <ChevronDown className="ml-1 md:ml-2 h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[160px] md:w-[180px] p-2 shadow-lg"
            align="start"
            sideOffset={8}
          >
            <div className="space-y-0.5">
              {availableWeights.map(w => (
                <button
                  key={w.value}
                  onClick={() => handleSelectWeight(w)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 md:py-2.5 rounded-lg text-left transition-all duration-200 touch-manipulation",
                    weight === w.value
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-foreground hover:bg-muted active:bg-muted/80"
                  )}
                  style={{ fontWeight: w.value }}
                >
                  <span className="text-xs md:text-sm">{w.label}</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground/70 tabular-nums font-mono">
                    {w.value}
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

// Simplified font picker for single selection without weight
export function SimpleFontPicker({
  value,
  onChange,
  placeholder = "Select font...",
  className,
}: {
  value: string;
  onChange: (font: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <GoogleFontPicker
      value={value}
      onFontChange={onChange}
      showWeightPicker={false}
      placeholder={placeholder}
      className={className}
    />
  );
}
