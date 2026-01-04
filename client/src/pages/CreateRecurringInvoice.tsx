import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { ClientSelector } from "@/components/invoices/ClientSelector";
import { LineItemRow, LineItem } from "@/components/invoices/LineItemRow";
import { InvoiceFormCalculations } from "@/components/invoices/InvoiceFormCalculations";

export default function CreateRecurringInvoice() {
  const [, setLocation] = useLocation();
  const [clientId, setClientId] = useState<number | undefined>();
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [invoiceNumberPrefix, setInvoiceNumberPrefix] = useState("INV");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");

  const createMutation = trpc.recurringInvoices.create.useMutation();

  const calculations = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    
    let discountAmount = 0;
    if (discountValue > 0) {
      if (discountType === "percentage") {
        discountAmount = (subtotal * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmount;
    
    return { subtotal, discountAmount, taxAmount, total };
  }, [lineItems, taxRate, discountType, discountValue]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) {
      toast.error("At least one line item is required");
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, item: LineItem) => {
    const updated = [...lineItems];
    updated[index] = item;
    setLineItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Please select a client");
      return;
    }

    if (lineItems.some(item => !item.description || item.quantity <= 0 || item.rate <= 0)) {
      toast.error("Please fill in all line items");
      return;
    }

    try {
      await createMutation.mutateAsync({
        clientId,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        invoiceNumberPrefix,
        lineItems: lineItems.map(({ id, ...item }) => item),
        taxRate,
        discountType,
        discountValue,
        notes,
        paymentTerms,
      });

      toast.success("Recurring invoice created successfully");
      setLocation("/recurring-invoices");
    } catch (error) {
      toast.error("Failed to create recurring invoice");
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => setLocation("/recurring-invoices")}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Recurring Invoices
      </Button>

      <h1 className="text-3xl font-bold mb-8">Create Recurring Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Schedule Settings</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invoiceNumberPrefix">Invoice Number Prefix</Label>
              <Input
                id="invoiceNumberPrefix"
                value={invoiceNumberPrefix}
                onChange={(e) => setInvoiceNumberPrefix(e.target.value)}
                placeholder="INV"
                required
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Client</h2>
          <ClientSelector value={clientId ?? null} onChange={(v) => setClientId(v ?? undefined)} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Line Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <LineItemRow
                key={item.id}
                item={item}
                onChange={(updatedItem) => handleLineItemChange(index, updatedItem)}
                onDelete={() => handleRemoveLineItem(index)}
                canDelete={lineItems.length > 1}
              />
            ))}
          </div>
        </Card>

        <InvoiceFormCalculations
          subtotal={calculations.subtotal}
          taxRate={taxRate}
          onTaxRateChange={setTaxRate}
          discountType={discountType}
          onDiscountTypeChange={setDiscountType}
          discountValue={discountValue}
          onDiscountValueChange={setDiscountValue}
          discountAmount={calculations.discountAmount}
          taxAmount={calculations.taxAmount}
          total={calculations.total}
        />

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Net 30"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for the invoice..."
                rows={3}
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Recurring Invoice"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/recurring-invoices")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
