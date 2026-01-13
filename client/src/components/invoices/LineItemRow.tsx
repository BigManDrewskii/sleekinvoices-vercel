import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { multiply, formatDecimal } from "@/lib/decimal";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface LineItemRowProps {
  item: LineItem;
  onChange: (item: LineItem) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function LineItemRow({ item, onChange, onDelete, canDelete }: LineItemRowProps) {
  // Use decimal.js for precise calculation
  const amount = parseFloat(formatDecimal(multiply(item.quantity, item.rate), 2));

  const handleChange = (field: keyof LineItem, value: string | number) => {
    onChange({ ...item, [field]: value });
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-start">
      {/* Description */}
      <div className="col-span-12 md:col-span-5">
        <Input
          placeholder="Description of service or product"
          value={item.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>

      {/* Quantity */}
      <div className="col-span-4 md:col-span-2">
        <Input
          type="number"
          placeholder="Qty"
          min="0"
          step="0.00000001"
          value={item.quantity || ''}
          onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Rate */}
      <div className="col-span-4 md:col-span-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            placeholder="0.00"
            min="0"
            step="0.00000001"
            value={item.rate || ''}
            onChange={(e) => handleChange('rate', parseFloat(e.target.value) || 0)}
            className="pl-7"
          />
        </div>
      </div>

      {/* Amount (calculated, read-only) */}
      <div className="col-span-3 md:col-span-2">
        <div className="h-10 px-3 flex items-center justify-end text-sm font-numeric bg-muted rounded-md">
          {formatCurrency(amount)}
        </div>
      </div>

      {/* Delete Button */}
      <div className="col-span-1 md:col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={!canDelete}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
