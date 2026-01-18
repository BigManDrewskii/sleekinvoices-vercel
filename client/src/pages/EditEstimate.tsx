import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { format } from "date-fns";

interface LineItem {
  id: string;
  description: string;
  quantity: string;
  rate: string;
  amount: string;
}

export default function EditEstimate() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const estimateId = parseInt(params.id || "0");

  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    currency: "USD",
    taxRate: "0",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "0",
    notes: "",
    terms: "",
    issueDate: "",
    validUntil: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { data: estimate, isLoading: estimateLoading } =
    trpc.estimates.get.useQuery(
      { id: estimateId },
      { enabled: isAuthenticated && estimateId > 0 }
    );

  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: products } = trpc.products.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateEstimate = trpc.estimates.update.useMutation({
    onSuccess: () => {
      toast.success("Estimate updated successfully");
      setLocation(`/estimates/${estimateId}`);
    },
    onError: error => {
      toast.error(error.message || "Failed to update estimate");
    },
  });

  // Initialize form with estimate data
  useEffect(() => {
    if (estimate && !initialized) {
      setFormData({
        clientId: estimate.estimate.clientId.toString(),
        title: estimate.estimate.title || "",
        currency: estimate.estimate.currency,
        taxRate: estimate.estimate.taxRate,
        discountType: estimate.estimate.discountType || "percentage",
        discountValue: estimate.estimate.discountValue,
        notes: estimate.estimate.notes || "",
        terms: estimate.estimate.terms || "",
        issueDate: format(new Date(estimate.estimate.issueDate), "yyyy-MM-dd"),
        validUntil: format(
          new Date(estimate.estimate.validUntil),
          "yyyy-MM-dd"
        ),
      });

      setLineItems(
        estimate.lineItems.map((item, index) => ({
          id: item.id.toString(),
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        }))
      );

      setInitialized(true);
    }
  }, [estimate, initialized]);

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);

    let discountAmount = 0;
    if (formData.discountType === "percentage") {
      discountAmount =
        (subtotal * (parseFloat(formData.discountValue) || 0)) / 100;
    } else {
      discountAmount = parseFloat(formData.discountValue) || 0;
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount =
      (afterDiscount * (parseFloat(formData.taxRate) || 0)) / 100;
    const total = afterDiscount + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  }, [
    lineItems,
    formData.discountType,
    formData.discountValue,
    formData.taxRate,
  ]);

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems(items =>
      items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          const qty = parseFloat(updated.quantity) || 0;
          const rate = parseFloat(updated.rate) || 0;
          updated.amount = (qty * rate).toFixed(2);
        }
        return updated;
      })
    );
  };

  const addLineItem = () => {
    setLineItems(items => [
      ...items,
      {
        id: `new-${Date.now()}`,
        description: "",
        quantity: "1",
        rate: "",
        amount: "0",
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems(items => items.filter(item => item.id !== id));
  };

  const addProductToLineItems = (productId: string) => {
    const product = products?.find(p => p.id === parseInt(productId));
    if (!product) return;

    setLineItems(items => [
      ...items,
      {
        id: `new-${Date.now()}`,
        description: product.description || product.name,
        quantity: "1",
        rate: product.rate,
        amount: product.rate,
      },
    ]);
  };

  const handleSubmit = () => {
    if (!formData.clientId) {
      toast.error("Please select a client");
      return;
    }

    const validLineItems = lineItems.filter(
      item => item.description && parseFloat(item.amount) > 0
    );

    if (validLineItems.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    updateEstimate.mutate({
      id: estimateId,
      clientId: parseInt(formData.clientId),
      title: formData.title || null,
      currency: formData.currency,
      subtotal: calculations.subtotal.toFixed(2),
      taxRate: formData.taxRate,
      taxAmount: calculations.taxAmount.toFixed(2),
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      discountAmount: calculations.discountAmount.toFixed(2),
      total: calculations.total.toFixed(2),
      notes: formData.notes || null,
      terms: formData.terms || null,
      issueDate: new Date(formData.issueDate),
      validUntil: new Date(formData.validUntil),
      lineItems: validLineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
    });
  };

  if (loading || estimateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="opacity-70">
          <GearLoader size="md" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Estimate Not Found
          </h1>
          <Link href="/estimates">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Estimates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/estimates/${estimateId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Edit Estimate
              </h1>
              <p className="text-muted-foreground">
                {estimate.estimate.estimateNumber}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Client & Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Estimate Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, clientId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map(client => (
                          <SelectItem
                            key={client.id}
                            value={client.id.toString()}
                          >
                            {client.name}
                            {client.companyName && ` (${client.companyName})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, currency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">
                          CAD - Canadian Dollar
                        </SelectItem>
                        <SelectItem value="AUD">
                          AUD - Australian Dollar
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title / Subject (optional)</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Website Redesign Proposal"
                    value={formData.title}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          issueDate: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          validUntil: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Line Items</CardTitle>
                  {products && products.length > 0 && (
                    <Select onValueChange={addProductToLineItems}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Add from products" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem
                            key={product.id}
                            value={product.id.toString()}
                          >
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 items-start"
                    >
                      <div className="col-span-12 md:col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={e =>
                            updateLineItem(
                              item.id,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e =>
                            updateLineItem(item.id, "quantity", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={e =>
                            updateLineItem(item.id, "rate", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        <Input
                          readOnly
                          value={`${formData.currency} ${item.amount}`}
                          className="bg-muted"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length === 1}
                          aria-label={`Remove line item: ${item.description || "Item " + (index + 1)}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={addLineItem}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle>Totals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formData.currency} {calculations.subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Discount</Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.discountType}
                          onValueChange={(value: "percentage" | "fixed") =>
                            setFormData(prev => ({
                              ...prev,
                              discountType: value,
                            }))
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="fixed">
                              {formData.currency}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.discountValue}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              discountValue: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.taxRate}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            taxRate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {calculations.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-destructive">
                        -{formData.currency}{" "}
                        {calculations.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {calculations.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tax ({formData.taxRate}%)
                      </span>
                      <span>
                        {formData.currency} {calculations.taxAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold pt-4 border-t">
                    <span>Total</span>
                    <span>
                      {formData.currency} {calculations.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Notes & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes for the client..."
                    value={formData.notes}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, notes: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    placeholder="Payment terms, conditions, etc..."
                    value={formData.terms}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, terms: e.target.value }))
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Link href={`/estimates/${estimateId}`}>
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleSubmit}
                disabled={updateEstimate.isPending}
              >
                {updateEstimate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
