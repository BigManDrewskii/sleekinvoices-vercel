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
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'display', label: 'Display' },
  { value: 'handwriting', label: 'Handwriting' },
  { value: 'monospace', label: 'Monospace' },
] as const;

export function GoogleFontPicker({
  value,
  weight = 400,
  onFontChange,
  onWeightChange,
  showWeightPicker = true,
  placeholder = 'Select font...',
  className,
}: GoogleFontPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [weightOpen, setWeightOpen] = useState(false);

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
    loadGoogleFont(family, ['400']);
  }, []);

  const handleSelectFont = (font: GoogleFont) => {
    onFontChange(font.family);
    loadGoogleFont(font.family, ['300', '400', '500', '600', '700']);
    setOpen(false);
    setSearch('');
  };

  const handleSelectWeight = (w: FontWeight) => {
    onWeightChange?.(w.value);
    setWeightOpen(false);
  };

  const currentWeight = availableWeights.find(w => w.value === weight) || availableWeights.find(w => w.value === 400);

  return (
    <div className={cn('flex gap-2', className)}>
      {/* Font Family Picker */}
      <Popover open={open} onOpenChange={setOpen}>
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
        <PopoverContent className="w-[320px] p-0 bg-slate-900 border-slate-700" align="start">
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
          <ScrollArea className="h-[280px]">
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
