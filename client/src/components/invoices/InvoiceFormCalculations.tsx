import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "../ui/typography";
import { PercentageInput, CurrencyInput } from "../ui/specialized-inputs";
import { FormField } from "../ui/form-field";

interface InvoiceFormCalculationsProps {
  subtotal: number;
  taxRate: number;
  onTaxRateChange: (value: number) => void;
  discountType: 'percentage' | 'fixed';
  onDiscountTypeChange: (value: 'percentage' | 'fixed') => void;
  discountValue: number;
  onDiscountValueChange: (value: number) => void;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

export function InvoiceFormCalculations({
  subtotal,
  taxRate,
  onTaxRateChange,
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  discountAmount,
  taxAmount,
  total,
}: InvoiceFormCalculationsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-2 border-t">
        <span className="text-sm font-medium">Subtotal</span>
        <span className="text-sm font-semibold"><Currency amount={subtotal} /></span>
      </div>

      {/* Discount */}
      <div className="space-y-2">
        <Label>Discount</Label>
        <div className="flex gap-2">
          <Select value={discountType} onValueChange={onDiscountTypeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder={discountType === 'percentage' ? '0%' : '$0.00'}
            min="0"
            step={discountType === 'percentage' ? '1' : '0.01'}
            max={discountType === 'percentage' ? '100' : undefined}
            value={discountValue || ''}
            onChange={(e) => onDiscountValueChange(parseFloat(e.target.value) || 0)}
            className="flex-1"
          />
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Discount amount</span>
            <span>-<Currency amount={discountAmount} /></span>
          </div>
        )}
      </div>

      {/* Tax */}
      <FormField label="Tax Rate (%)">
        <PercentageInput
          placeholder="0"
          value={taxRate || ''}
          onValueChange={(value) => onTaxRateChange(parseFloat(value) || 0)}
        />
        {taxAmount > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
            <span>Tax amount</span>
            <span>+<Currency amount={taxAmount} /></span>
          </div>
        )}
      </FormField>

      {/* Total */}
      <div className="flex items-center justify-between py-3 border-t-2 border-primary/20">
        <span className="text-lg font-bold">Total</span>
        <span className="text-2xl font-bold text-primary"><Currency amount={total} /></span>
      </div>
    </div>
  );
}
