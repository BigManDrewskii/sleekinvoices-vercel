import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, RefreshCw, Pause, Play, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { RecurringInvoicesPageSkeleton } from "@/components/skeletons";
import { DateDisplay } from "@/components/ui/typography";

export default function RecurringInvoices() {
  const [, setLocation] = useLocation();
  const { data: recurringInvoices, isLoading } = trpc.recurringInvoices.list.useQuery();
  const toggleMutation = trpc.recurringInvoices.toggle.useMutation();
  const deleteMutation = trpc.recurringInvoices.delete.useMutation();
  const utils = trpc.useUtils();

  const handleToggle = async (id: number, currentStatus: boolean) => {
    // Optimistic update: immediately toggle status in UI
    const previousData = utils.recurringInvoices.list.getData();
    utils.recurringInvoices.list.setData(undefined, (old) => 
      old?.map((item: any) => 
        item.id === id ? { ...item, isActive: !currentStatus } : item
      )
    );
    
    try {
      await toggleMutation.mutateAsync({ id, isActive: !currentStatus });
      toast.success(currentStatus ? "Recurring invoice paused" : "Recurring invoice activated");
    } catch (error) {
      // Rollback on error
      if (previousData) {
        utils.recurringInvoices.list.setData(undefined, previousData);
      }
      toast.error("Failed to toggle recurring invoice");
    } finally {
      utils.recurringInvoices.list.invalidate();
    }
  };

  const pendingDeleteRef = useRef<{ timeoutId: NodeJS.Timeout; id: number } | null>(null);

  const handleDelete = async (id: number, clientName?: string) => {
    if (!confirm("Are you sure you want to delete this recurring invoice?")) return;
    
    // Cancel any existing pending delete
    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current.timeoutId);
      pendingDeleteRef.current = null;
    }

    // Snapshot the previous value for potential restore
    const previousData = utils.recurringInvoices.list.getData();
    
    // Optimistically remove from UI immediately
    utils.recurringInvoices.list.setData(undefined, (old) => 
      old?.filter((item: any) => item.id !== id)
    );

    // Show undo toast
    toast(
      `Recurring invoice deleted`,
      {
        description: 'Click undo to restore',
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => {
            // Cancel the pending delete
            if (pendingDeleteRef.current) {
              clearTimeout(pendingDeleteRef.current.timeoutId);
              pendingDeleteRef.current = null;
            }
            
            // Restore to UI
            if (previousData) {
              utils.recurringInvoices.list.setData(undefined, previousData);
            } else {
              utils.recurringInvoices.list.invalidate();
            }
            
            toast.success('Recurring invoice restored');
          },
        },
      }
    );

    // Set timeout to permanently delete after 5 seconds
    const timeoutId = setTimeout(async () => {
      pendingDeleteRef.current = null;
      
      try {
        await deleteMutation.mutateAsync({ id });
      } catch (error) {
        // Restore on error
        if (previousData) {
          utils.recurringInvoices.list.setData(undefined, previousData);
        } else {
          utils.recurringInvoices.list.invalidate();
        }
        toast.error("Failed to delete recurring invoice. Item has been restored.");
      } finally {
        utils.recurringInvoices.list.invalidate();
      }
    }, 5000);

    pendingDeleteRef.current = { timeoutId, id };
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return <RecurringInvoicesPageSkeleton />;
  }

  return (
    <PageLayout
      title="Recurring Invoices"
      subtitle="Automate invoice generation for subscription-based clients"
      headerActions={
        <Button onClick={() => setLocation("/recurring-invoices/create")}>
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Create Recurring Invoice</span>
          <span className="sm:hidden">New</span>
        </Button>
      }
    >
      {!recurringInvoices || recurringInvoices.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No recurring invoices yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Set up automatic invoice generation for your subscription clients
          </p>
          <Button onClick={() => setLocation("/recurring-invoices/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Recurring Invoice
          </Button>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="space-y-4">
              {recurringInvoices.map((recurring: any) => (
                <Card key={recurring.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {recurring.clientName || 'Unknown Client'}
                        </h3>
                        <Badge variant={recurring.isActive ? "default" : "secondary"}>
                          {recurring.isActive ? "Active" : "Paused"}
                        </Badge>
                        <Badge variant="outline">
                          {getFrequencyLabel(recurring.frequency)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {recurring.invoiceNumberPrefix} • {recurring.clientEmail || 'No email'}
                      </p>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p className="font-medium"><DateDisplay date={recurring.startDate} format="long" /></p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Next Invoice</p>
                          <p className="font-medium"><DateDisplay date={recurring.nextInvoiceDate} format="long" /></p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">End Date</p>
                          <p className="font-medium"><DateDisplay date={recurring.endDate} format="long" /></p>
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
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {recurringInvoices.map((recurring: any) => (
              <Card key={recurring.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {recurring.clientName || 'Unknown Client'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {recurring.invoiceNumberPrefix}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={recurring.isActive ? "default" : "secondary"} className="text-xs">
                        {recurring.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Frequency</p>
                      <p className="font-medium">{getFrequencyLabel(recurring.frequency)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Invoice</p>
                      <p className="font-medium"><DateDisplay date={recurring.nextInvoiceDate} format="long" /></p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="default"
                      className="flex-1 h-11"
                      onClick={() => handleToggle(recurring.id, recurring.isActive)}
                    >
                      {recurring.isActive ? (
                        <><Pause className="w-4 h-4 mr-2" /> Pause</>
                      ) : (
                        <><Play className="w-4 h-4 mr-2" /> Activate</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      className="h-11 px-3"
                      onClick={() => setLocation(`/recurring-invoices/edit/${recurring.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      className="h-11 px-3"
                      onClick={() => handleDelete(recurring.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </PageLayout>
  );
}
