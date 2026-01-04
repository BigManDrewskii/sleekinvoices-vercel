import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClientSelector } from "@/components/invoices/ClientSelector";
import { LineItemRow, LineItem } from "@/components/invoices/LineItemRow";
import { InvoiceFormCalculations } from "@/components/invoices/InvoiceFormCalculations";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Save } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { nanoid } from "nanoid";

export default function EditInvoice() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const invoiceId = parseInt(params.id || "0");

  // Form state
  const [clientId, setClientId] = useState<number | null>(null);
  const [issueDate, setIssueDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [status, setStatus] = useState<string>('draft');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch invoice data
  const { data, isLoading } = trpc.invoices.get.useQuery(
    { id: invoiceId },
    { enabled: isAuthenticated && invoiceId > 0 }
  );

  // Populate form when data loads
  useEffect(() => {
    if (data) {
      const { invoice, lineItems: fetchedLineItems } = data;
      setClientId(invoice.clientId);
      setIssueDate(new Date(invoice.issueDate).toISOString().split('T')[0]);
      setDueDate(new Date(invoice.dueDate).toISOString().split('T')[0]);
      setTaxRate(parseFloat(invoice.taxRate));
      setDiscountType(invoice.discountType as 'percentage' | 'fixed');
      setDiscountValue(parseFloat(invoice.discountValue));
      setNotes(invoice.notes || '');
      setPaymentTerms(invoice.paymentTerms || '');
      setInvoiceNumber(invoice.invoiceNumber);
      setStatus(invoice.status);
      
      // Convert fetched line items to form format
      setLineItems(
        fetchedLineItems.map(item => ({
          id: nanoid(),
          description: item.description,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
        }))
      );
    }
  }, [data]);

  const utils = trpc.useUtils();
  const updateInvoice = trpc.invoices.update.useMutation({
    onSuccess: () => {
      toast.success("Invoice updated successfully");
      utils.invoices.list.invalidate();
      utils.invoices.get.invalidate({ id: invoiceId });
      setLocation(`/invoices/${invoiceId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update invoice");
    },
  });

  // Calculations
  const calculations = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.rate);
    }, 0);

    let discountAmount = 0;
    if (discountValue > 0) {
      if (discountType === 'percentage') {
        discountAmount = (subtotal * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  }, [lineItems, taxRate, discountType, discountValue]);

  // Line item operations
  const addLineItem = () => {
    setLineItems([...lineItems, { id: nanoid(), description: '', quantity: 1, rate: 0 }]);
  };

  const updateLineItem = (id: string, updated: LineItem) => {
    setLineItems(lineItems.map(item => item.id === id ? updated : item));
  };

  const deleteLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!clientId) {
      newErrors.clientId = "Please select a client";
    }

    if (!issueDate) {
      newErrors.issueDate = "Issue date is required";
    }

    if (!dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    if (issueDate && dueDate && new Date(dueDate) < new Date(issueDate)) {
      newErrors.dueDate = "Due date must be after issue date";
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = "At least one line item is required";
    }

    lineItems.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`lineItem_${index}_description`] = "Description is required";
      }
      if (item.quantity <= 0) {
        newErrors[`lineItem_${index}_quantity`] = "Quantity must be greater than 0";
      }
      if (item.rate < 0) {
        newErrors[`lineItem_${index}_rate`] = "Rate cannot be negative";
      }
    });

    if (taxRate < 0 || taxRate > 100) {
      newErrors.taxRate = "Tax rate must be between 0 and 100";
    }

    if (discountValue < 0) {
      newErrors.discountValue = "Discount cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSave = () => {
    if (!validate()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    updateInvoice.mutate({
      id: invoiceId,
      clientId: clientId!,
      status: status as any,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      lineItems: lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
      })),
      taxRate,
      discountType,
      discountValue,
      notes,
      paymentTerms,
    });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Invoice Not Found</h1>
          <Link href="/invoices">
            <a>
              <Button>Back to Invoices</Button>
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <a className="flex items-center gap-2">
                <img src="/SleekInvoices-Wide.svg" alt="SleekInvoices" className="h-6" />
              </a>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </a>
              </Link>
              <Link href="/invoices">
                <a className="text-sm font-medium text-foreground">Invoices</a>
              </Link>
              <Link href="/clients">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Clients
                </a>
              </Link>
              <Link href="/analytics">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </a>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {user?.name || "Settings"}
              </a>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Invoice</h1>
              <p className="text-muted-foreground">Update invoice {invoiceNumber}</p>
            </div>
            <Link href={`/invoices/${invoiceId}`}>
              <a>
                <Button variant="outline">Cancel</Button>
              </a>
            </Link>
          </div>

          <div className="space-y-6">
            {/* Client and Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>Basic information about the invoice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ClientSelector
                  value={clientId}
                  onChange={setClientId}
                  error={errors.clientId}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Number</Label>
                    <Input value={invoiceNumber} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Issue Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className={errors.issueDate ? "border-red-500" : ""}
                    />
                    {errors.issueDate && (
                      <p className="text-sm text-red-500">{errors.issueDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Due Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={errors.dueDate ? "border-red-500" : ""}
                    />
                    {errors.dueDate && (
                      <p className="text-sm text-red-500">{errors.dueDate}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Line Items</CardTitle>
                    <CardDescription>Products or services on the invoice</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Header Row */}
                <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Line Items */}
                {lineItems.map((item) => (
                  <LineItemRow
                    key={item.id}
                    item={item}
                    onChange={(updated) => updateLineItem(item.id, updated)}
                    onDelete={() => deleteLineItem(item.id)}
                    canDelete={lineItems.length > 1}
                  />
                ))}

                {errors.lineItems && (
                  <p className="text-sm text-red-500">{errors.lineItems}</p>
                )}
              </CardContent>
            </Card>

            {/* Calculations */}
            <Card>
              <CardHeader>
                <CardTitle>Totals</CardTitle>
                <CardDescription>Tax, discounts, and final total</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Notes and Payment Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Notes and payment terms for the client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Add any additional notes or comments..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Input
                    placeholder="e.g., Net 30, Due on receipt"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4">
              <Link href={`/invoices/${invoiceId}`}>
                <a>
                  <Button variant="outline">Cancel</Button>
                </a>
              </Link>
              <Button
                onClick={handleSave}
                disabled={updateInvoice.isPending}
              >
                {updateInvoice.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
