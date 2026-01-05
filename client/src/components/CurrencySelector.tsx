import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, ChevronsUpDown, Coins, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FIAT_CURRENCIES,
  CRYPTO_CURRENCIES,
  POPULAR_FIAT,
  POPULAR_CRYPTO,
  getCurrency,
  type Currency,
} from '../../../shared/currencies';

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  showTabs?: boolean; // Show Fiat/Crypto tabs
  allowCrypto?: boolean; // Allow crypto selection
}

export function CurrencySelector({
  value,
  onChange,
  disabled = false,
  className,
  showTabs = true,
  allowCrypto = true,
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'fiat' | 'crypto'>('fiat');

  const selectedCurrency = getCurrency(value);
  const currencies = activeTab === 'fiat' ? FIAT_CURRENCIES : CRYPTO_CURRENCIES;
  const popularCodes = activeTab === 'fiat' ? POPULAR_FIAT : POPULAR_CRYPTO;

  // Separate popular and other currencies
  const popularCurrencies = currencies.filter((c) => popularCodes.includes(c.code));
  const otherCurrencies = currencies.filter((c) => !popularCodes.includes(c.code));

  const handleSelect = (currency: Currency) => {
    onChange(currency.code);
    setOpen(false);
  };

  const renderCurrencyItem = (currency: Currency) => (
    <CommandItem
      key={currency.code}
      value={`${currency.code} ${currency.name}`}
      onSelect={() => handleSelect(currency)}
      className="flex items-center gap-2 cursor-pointer"
    >
      <span className="w-8 text-center font-mono text-lg">{currency.symbol}</span>
      <span className="flex-1">
        <span className="font-medium">{currency.code}</span>
        <span className="text-muted-foreground ml-2 text-sm">{currency.name}</span>
      </span>
      <Check
        className={cn(
          'h-4 w-4',
          value === currency.code ? 'opacity-100' : 'opacity-0'
        )}
      />
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('justify-between', className)}
        >
          {selectedCurrency ? (
            <span className="flex items-center gap-2">
              <span className="font-mono text-lg">{selectedCurrency.symbol}</span>
              <span>{selectedCurrency.code}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select currency...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        {showTabs && allowCrypto && (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'fiat' | 'crypto')}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
              <TabsTrigger value="fiat" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Fiat
              </TabsTrigger>
              <TabsTrigger value="crypto" className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Crypto
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup heading="Popular">
              {popularCurrencies.map(renderCurrencyItem)}
            </CommandGroup>
            <CommandGroup heading="All Currencies">
              {otherCurrencies.map(renderCurrencyItem)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Compact currency display for showing in tables/lists
 */
export function CurrencyBadge({ code, className }: { code: string; className?: string }) {
  const currency = getCurrency(code);
  if (!currency) return <span className={className}>{code}</span>;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        currency.type === 'crypto'
          ? 'bg-amber-500/10 text-amber-500'
          : 'bg-emerald-500/10 text-emerald-500',
        className
      )}
    >
      <span className="font-mono">{currency.symbol}</span>
      <span>{currency.code}</span>
    </span>
  );
}

/**
 * Simple inline currency symbol display
 */
export function CurrencySymbol({ code, className }: { code: string; className?: string }) {
  const currency = getCurrency(code);
  return (
    <span className={cn('font-mono', className)}>
      {currency?.symbol || code}
    </span>
  );
}
