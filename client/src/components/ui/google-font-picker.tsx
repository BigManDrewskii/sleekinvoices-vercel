import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GoogleFont,
  POPULAR_FONTS,
  FONT_WEIGHTS,
  loadGoogleFont,
  getAvailableWeights,
  searchFonts,
  filterFontsByCategory,
  FontWeight,
} from '@/lib/google-fonts';

interface GoogleFontPickerProps {
  value: string;
  weight?: number;
  onFontChange: (font: string) => void;
  onWeightChange?: (weight: number) => void;
  showWeightPicker?: boolean;
  placeholder?: string;
  className?: string;
  previewType?: 'heading' | 'body';
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'display', label: 'Display' },
  { value: 'handwriting', label: 'Handwriting' },
  { value: 'monospace', label: 'Monospace' },
] as const;

/**
 * Live Invoice Preview Component
 * Shows how the font will look on actual invoice elements
 */
function LiveInvoicePreview({ 
  font, 
  weight,
  type 
}: { 
  font: string; 
  weight: number;
  type: 'heading' | 'body';
}) {
  const fontStyle = { fontFamily: `"${font}", sans-serif`, fontWeight: weight };
  
  if (type === 'heading') {
    return (
      <div className="p-4 bg-white rounded-lg text-slate-900 space-y-3">
        <div className="flex items-center justify-between">
          <span 
            className="text-2xl font-semibold text-primary"
            style={fontStyle}
          >
            INVOICE
          </span>
          <span className="text-xs text-slate-400">#INV-001</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 uppercase tracking-wide" style={fontStyle}>From</span>
            <p className="text-slate-700 mt-1">Your Company</p>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-wide" style={fontStyle}>Bill To</span>
            <p className="text-slate-700 mt-1">Client Name</p>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-200">
          <div className="flex justify-between text-sm">
            <span style={fontStyle} className="font-medium">Total</span>
            <span style={fontStyle} className="font-semibold text-primary">$1,234.56</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Body font preview
  return (
    <div className="p-4 bg-white rounded-lg text-slate-900 space-y-3">
      <div className="text-xs text-slate-400 mb-2">Body Text Preview</div>
      <div className="space-y-2" style={fontStyle}>
        <p className="text-sm text-slate-700">
          Professional Services - Web Development
        </p>
        <p className="text-sm text-slate-700">
          Consulting & Strategy Session (2 hours)
        </p>
        <p className="text-xs text-slate-500">
          Payment is due within 30 days of invoice date.
        </p>
      </div>
      <div className="pt-2 border-t border-slate-200 flex justify-between text-sm" style={fontStyle}>
        <span>Subtotal</span>
        <span>$1,000.00</span>
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
  placeholder = 'Select font...',
  className,
  previewType = 'heading',
}: GoogleFontPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [weightOpen, setWeightOpen] = useState(false);
  const [hoveredFont, setHoveredFont] = useState<string | null>(null);

  // Find the currently selected font
  const selectedFont = useMemo(() => {
    return POPULAR_FONTS.find(f => f.family === value);
  }, [value]);

  // Get available weights for selected font
  const availableWeights = useMemo(() => {
    if (!selectedFont) return FONT_WEIGHTS.filter(w => w.value === 400 || w.value === 700);
    return getAvailableWeights(selectedFont);
  }, [selectedFont]);

  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    let fonts = POPULAR_FONTS;
    
    if (category !== 'all') {
      fonts = filterFontsByCategory(category as GoogleFont['category'], fonts);
    }
    
    if (search) {
      fonts = searchFonts(search, fonts);
    }
    
    return fonts;
  }, [search, category]);

  // Load the selected font
  useEffect(() => {
    if (value) {
      loadGoogleFont(value, ['300', '400', '500', '600', '700']);
    }
  }, [value]);

  // Load fonts as they appear in the list (for preview)
  const loadFontForPreview = useCallback((family: string) => {
    loadGoogleFont(family, ['400', '600', '700']);
    setHoveredFont(family);
  }, []);

  const handleSelectFont = (font: GoogleFont) => {
    onFontChange(font.family);
    loadGoogleFont(font.family, ['300', '400', '500', '600', '700']);
    setOpen(false);
    setSearch('');
    setHoveredFont(null);
  };

  const handleSelectWeight = (w: FontWeight) => {
    onWeightChange?.(w.value);
    setWeightOpen(false);
  };

  const currentWeight = availableWeights.find(w => w.value === weight) || availableWeights.find(w => w.value === 400);
  
  // Determine which font to show in preview
  const previewFont = hoveredFont || value || 'Inter';

  return (
    <div className={cn('flex gap-2', className)}>
      {/* Font Family Picker */}
      <Popover open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setHoveredFont(null);
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-left font-normal"
            style={{ fontFamily: value || 'inherit' }}
          >
            <span className="truncate">
              {value || placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0 bg-slate-900 border-slate-700" align="start">
          <div className="flex">
            {/* Left side - Font list */}
            <div className="w-[320px] border-r border-slate-700">
              {/* Search */}
              <div className="p-3 border-b border-slate-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search fonts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-slate-800 border-slate-700"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <div className="p-2 border-b border-slate-700 flex gap-1 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      'px-2 py-1 text-xs rounded-md transition-colors',
                      category === cat.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Font List */}
              <ScrollArea className="h-[320px]">
                <div className="p-2">
                  {filteredFonts.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm">
                      No fonts found
                    </div>
                  ) : (
                    filteredFonts.map((font) => (
                      <button
                        key={font.family}
                        onClick={() => handleSelectFont(font)}
                        onMouseEnter={() => loadFontForPreview(font.family)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors',
                          value === font.family
                            ? 'bg-primary/20 text-primary'
                            : hoveredFont === font.family
                            ? 'bg-slate-800 text-slate-100'
                            : 'hover:bg-slate-800 text-slate-200'
                        )}
                      >
                        <span
                          className="text-base truncate"
                          style={{ fontFamily: `"${font.family}", ${font.category}` }}
                        >
                          {font.family}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 capitalize">
                            {font.category}
                          </span>
                          {value === font.family && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Font Count */}
              <div className="p-2 border-t border-slate-700 text-xs text-slate-500 text-center">
                {filteredFonts.length} fonts available
              </div>
            </div>

            {/* Right side - Live Preview */}
            <div className="w-[280px] p-4 bg-slate-800/50">
              <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
                <span>Live Preview</span>
                {hoveredFont && (
                  <span className="text-primary font-medium">{hoveredFont}</span>
                )}
              </div>
              <LiveInvoicePreview 
                font={previewFont} 
                weight={weight}
                type={previewType}
              />
              <div className="mt-3 text-xs text-slate-500 text-center">
                Hover over fonts to preview
              </div>
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
              className="w-[120px] justify-between bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
            >
              <span className="truncate">{currentWeight?.label || 'Regular'}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[160px] p-2 bg-slate-900 border-slate-700" align="start">
            {availableWeights.map((w) => (
              <button
                key={w.value}
                onClick={() => handleSelectWeight(w)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors',
                  weight === w.value
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-slate-800 text-slate-200'
                )}
                style={{ fontWeight: w.value }}
              >
                <span>{w.label}</span>
                <span className="text-xs text-slate-500">{w.value}</span>
              </button>
            ))}
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
  placeholder = 'Select font...',
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
