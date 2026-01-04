import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Calendar, RefreshCw, Pause, Play, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function RecurringInvoices() {
  const [, setLocation] = useLocation();
  const { data: recurringInvoices, isLoading } = trpc.recurringInvoices.list.useQuery();
  const toggleMutation = trpc.recurringInvoices.toggle.useMutation();
  const deleteMutation = trpc.recurringInvoices.delete.useMutation();
  const utils = trpc.useUtils();

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, isActive: !currentStatus });
      utils.recurringInvoices.list.invalidate();
      toast.success(currentStatus ? "Recurring invoice paused" : "Recurring invoice activated");
    } catch (error) {
      toast.error("Failed to toggle recurring invoice");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this recurring invoice?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      utils.recurringInvoices.list.invalidate();
      toast.success("Recurring invoice deleted");
    } catch (error) {
      toast.error("Failed to delete recurring invoice");
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Recurring Invoices</h1>
          <p className="text-muted-foreground mt-2">
            Automate invoice generation for subscription-based clients
          </p>
        </div>
        <Button onClick={() => setLocation("/recurring-invoices/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Recurring Invoice
        </Button>
      </div>

      {!recurringInvoices || recurringInvoices.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No recurring invoices yet</h3>
          <p className="text-muted-foreground mb-6">
            Set up automatic invoice generation for your subscription clients
          </p>
          <Button onClick={() => setLocation("/recurring-invoices/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Recurring Invoice
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {recurringInvoices.map((recurring: any) => (
            <Card key={recurring.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {recurring.invoiceNumberPrefix}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      recurring.isActive 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {recurring.isActive ? "Active" : "Paused"}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {getFrequencyLabel(recurring.frequency)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium">{formatDate(recurring.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Invoice</p>
                      <p className="font-medium">{formatDate(recurring.nextInvoiceDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Date</p>
                      <p className="font-medium">{formatDate(recurring.endDate)}</p>
                    </div>
                  </div>

                  {recurring.notes && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {recurring.notes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(recurring.id, recurring.isActive)}
                  >
                    {recurring.isActive ? (
                      <><Pause className="w-4 h-4 mr-1" /> Pause</>
                    ) : (
                      <><Play className="w-4 h-4 mr-1" /> Activate</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/recurring-invoices/edit/${recurring.id}`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(recurring.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
