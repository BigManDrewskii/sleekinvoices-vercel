import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClientSelector } from "@/components/invoices/ClientSelector";
import { LineItemRow, LineItem } from "@/components/invoices/LineItemRow";
import { BillableExpenseDialog } from "@/components/invoices/BillableExpenseDialog";
import { InvoiceFormCalculations } from "@/components/invoices/InvoiceFormCalculations";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Save, Send } from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { nanoid } from "nanoid";

export default function CreateInvoice() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Form state
  const [clientId, setClientId] = useState<number | null>(null);
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: nanoid(), description: '', quantity: 1, rate: 0 },
  ]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Billable expenses dialog
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [linkedExpenseIds, setLinkedExpenseIds] = useState<number[]>([]);

  // Fetch next invoice number
  const { data: nextNumber } = trpc.invoices.getNextNumber.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: (data) => {
      toast.success("Invoice created successfully");
      utils.invoices.list.invalidate();
      setLocation(`/invoices/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create invoice");
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

  // Submit handlers
  const handleSaveDraft = () => {
    if (!validate()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    createInvoice.mutate({
      clientId: clientId!,
      invoiceNumber: nextNumber || 'INV-0001',
      status: 'draft',
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
      expenseIds: linkedExpenseIds.length > 0 ? linkedExpenseIds : undefined,
    });
  };

  const handleSaveAndSend = () => {
    if (!validate()) {
      toast.error("Please fix the errors before sending");
      return;
    }

    createInvoice.mutate({
      clientId: clientId!,
      invoiceNumber: nextNumber || 'INV-0001',
      status: 'sent',
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
      expenseIds: linkedExpenseIds.length > 0 ? linkedExpenseIds : undefined,
    });
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
                <img src="/SleekInvoices-Wide.svg" alt="SleekInvoices" className="h-6" />
              </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              <Link href="/invoices" className="text-sm font-medium text-foreground">Invoices</Link>
              <Link href="/clients" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Clients
                </Link>
              <Link href="/analytics" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {user?.name || "Settings"}
              </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create Invoice</h1>
              <p className="text-muted-foreground">Fill in the details to create a new invoice</p>
            </div>
            <Link href="/invoices">
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
                    <Input value={nextNumber || 'Loading...'} disabled />
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
                    <CardDescription>Add products or services to the invoice</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowExpenseDialog(true)}
                      disabled={!clientId}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Add Billable Expenses
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
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
              <Link href="/invoices">
                <a>
                  <Button variant="outline">Cancel</Button>
                </a>
              </Link>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={createInvoice.isPending}
              >
                {createInvoice.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </>
                )}
              </Button>
              <Button
                onClick={handleSaveAndSend}
                disabled={createInvoice.isPending}
              >
                {createInvoice.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Save & Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Billable Expenses Dialog */}
      <BillableExpenseDialog
        open={showExpenseDialog}
        onOpenChange={setShowExpenseDialog}
        clientId={clientId}
        onAddExpenses={(expenses) => {
          const newItems = expenses.map(exp => ({
            id: nanoid(),
            description: `${exp.description} (${exp.vendor || 'Expense'})`,
            quantity: 1,
            rate: Number(exp.amount) + (Number(exp.taxAmount) || 0),
          }));
          setLineItems([...lineItems, ...newItems]);
          setLinkedExpenseIds([...linkedExpenseIds, ...expenses.map(e => e.id)]);
          setShowExpenseDialog(false);
          toast.success(`Added ${expenses.length} expense(s) to invoice`);
        }}
      />
    </div>
  );
}
