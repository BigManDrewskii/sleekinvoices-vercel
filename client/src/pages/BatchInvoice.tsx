import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Trash2, ArrowLeft, Users, CheckCircle, XCircle, Loader2, Save, FolderOpen, Tag, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/components/ui/typography";
import { SaveBatchTemplateDialog, LoadBatchTemplateDialog } from "@/components/BatchTemplateDialog";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface BatchResult {
  clientId: number;
  clientName: string;
  status: 'pending' | 'success' | 'error';
  invoiceNumber?: string;
  error?: string;
}

export default function BatchInvoice() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const clientIdsParam = searchParams.get('clients');
  
  // Parse client IDs from URL
  const initialClientIds = useMemo(() => {
    if (!clientIdsParam) return [];
    return clientIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
  }, [clientIdsParam]);

  // Selected client IDs state (can be modified by tag selection)
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>(initialClientIds);
  
  // Update selected IDs when URL changes
  useEffect(() => {
    setSelectedClientIds(initialClientIds);
  }, [initialClientIds]);

  // Form state
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0 }
  ]);
  const [dueInDays, setDueInDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [sendEmail, setSendEmail] = useState(false);
  const [status, setStatus] = useState<'draft' | 'sent'>('draft');
  
  // Batch creation state
  const [isCreating, setIsCreating] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Template dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);
  
  // Tag selection state
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

  // Queries
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: templates } = trpc.templates.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: clientTags } = trpc.clients.listTags.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: batchTemplates, refetch: refetchBatchTemplates } = trpc.batchTemplates.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: clientsByTag, isLoading: isLoadingClientsByTag } = trpc.clients.getClientsByTag.useQuery(
    { tagId: selectedTagId! },
    { enabled: isAuthenticated && selectedTagId !== null }
  );

  // Mutations
  const createInvoice = trpc.invoices.create.useMutation();
  const createBatchTemplate = trpc.batchTemplates.create.useMutation();
  const deleteBatchTemplate = trpc.batchTemplates.delete.useMutation();
  const incrementTemplateUsage = trpc.batchTemplates.incrementUsage.useMutation();
  const utils = trpc.useUtils();

  // Use default settings for batch creation
  const settings = { currency: 'USD', taxRate: 0 };

  // Get selected clients
  const selectedClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => selectedClientIds.includes(c.id));
  }, [clients, selectedClientIds]);

  // Calculate totals
  const lineItemsTotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  }, [lineItems]);

  const totalForAllClients = lineItemsTotal * selectedClients.length;

  // Set default template
  useEffect(() => {
    if (templates && templates.length > 0 && !templateId) {
      const defaultTemplate = templates.find(t => t.isDefault);
      setTemplateId(defaultTemplate?.id || templates[0].id);
    }
  }, [templates, templateId]);

  // Line item handlers
  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0
    }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Generate invoice number
  const generateInvoiceNumber = (index: number) => {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    return `INV-${year}-BATCH-${timestamp}-${(index + 1).toString().padStart(3, '0')}`;
  };
  
  // Handle tag selection to add clients
  const handleTagSelect = (tagId: string) => {
    if (tagId === 'none') {
      setSelectedTagId(null);
      return;
    }
    setSelectedTagId(parseInt(tagId));
  };
  
  // Add clients from selected tag
  const handleAddClientsFromTag = () => {
    if (!clientsByTag || clientsByTag.length === 0) return;
    
    const newClientIds = clientsByTag.map(c => c.id);
    const uniqueIds = Array.from(new Set([...selectedClientIds, ...newClientIds]));
    setSelectedClientIds(uniqueIds);
    
    const addedCount = uniqueIds.length - selectedClientIds.length;
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} client${addedCount !== 1 ? 's' : ''} from tag`);
    } else {
      toast.info('All clients with this tag are already selected');
    }
    setSelectedTagId(null);
  };
  
  // Remove a client from selection
  const handleRemoveClient = (clientId: number) => {
    setSelectedClientIds(selectedClientIds.filter(id => id !== clientId));
  };
  
  // Save batch template
  const handleSaveTemplate = async (data: {
    name: string;
    description: string;
    frequency: 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  }) => {
    setIsSavingTemplate(true);
    try {
      await createBatchTemplate.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        frequency: data.frequency,
        dueInDays,
        notes: notes || undefined,
        invoiceTemplateId: templateId || undefined,
        lineItems: lineItems
          .filter(item => item.description && item.rate > 0)
          .map(item => ({
            description: item.description,
            quantity: item.quantity.toString(),
            rate: item.rate.toString(),
          })),
      });
      
      await refetchBatchTemplates();
      setShowSaveDialog(false);
      toast.success('Template saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };
  
  // Load batch template
  const handleLoadTemplate = async (batchTemplateId: number) => {
    try {
      // Fetch the template with line items
      const result = await utils.batchTemplates.get.fetch({ id: batchTemplateId });
      
      if (!result) {
        toast.error('Template not found');
        return;
      }
      
      const { template, lineItems: templateLineItems } = result;
      
      // Apply template settings
      setDueInDays(template.dueInDays);
      setNotes(template.notes || '');
      if (template.invoiceTemplateId) {
        setTemplateId(template.invoiceTemplateId);
      }
      
      // Apply line items
      if (templateLineItems.length > 0) {
        setLineItems(templateLineItems.map((item: { description: string; quantity: string; rate: string }, index: number) => ({
          id: `loaded-${index}-${Date.now()}`,
          description: item.description,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
        })));
      }
      
      // Increment usage count
      await incrementTemplateUsage.mutateAsync({ id: batchTemplateId });
      await refetchBatchTemplates();
      
      toast.success(`Loaded template: ${template.name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load template');
    }
  };
  
  // Delete batch template
  const handleDeleteTemplate = async (batchTemplateId: number) => {
    setDeletingTemplateId(batchTemplateId);
    try {
      await deleteBatchTemplate.mutateAsync({ id: batchTemplateId });
      await refetchBatchTemplates();
      toast.success('Template deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template');
    } finally {
      setDeletingTemplateId(null);
    }
  };

  // Create batch invoices
  const handleCreateBatch = async () => {
    if (selectedClients.length === 0) {
      toast.error('No clients selected');
      return;
    }

    if (lineItems.every(item => !item.description || item.rate === 0)) {
      toast.error('Please add at least one line item with description and rate');
      return;
    }

    setIsCreating(true);
    setShowResults(true);
    
    // Initialize results
    const initialResults: BatchResult[] = selectedClients.map(client => ({
      clientId: client.id,
      clientName: client.name,
      status: 'pending'
    }));
    setBatchResults(initialResults);

    // Create invoices sequentially
    const results: BatchResult[] = [...initialResults];
    for (let i = 0; i < selectedClients.length; i++) {
      const client = selectedClients[i];
      const invoiceNumber = generateInvoiceNumber(i);
      
      try {
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueInDays);

        await createInvoice.mutateAsync({
          clientId: client.id,
          invoiceNumber,
          issueDate: issueDate,
          dueDate: dueDate,
          status: sendEmail ? 'sent' : status,
          notes,
          templateId: templateId || undefined,
          lineItems: lineItems.filter(item => item.description && item.rate > 0).map(item => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
          })),
          taxRate: settings?.taxRate || 0,
          discountType: 'percentage',
          discountValue: 0,
        });

        // Update result to success
        results[i] = { ...results[i], status: 'success', invoiceNumber };
        setBatchResults([...results]);
      } catch (error: any) {
        // Update result to error
        results[i] = { ...results[i], status: 'error', error: error.message || 'Failed to create invoice' };
        setBatchResults([...results]);
      }
    }

    setIsCreating(false);
    
    const successCount = results.filter(r => r.status === 'success').length;
    if (successCount === selectedClients.length) {
      toast.success(`Successfully created ${successCount} invoices`);
    } else {
      toast.warning(`Created ${successCount} of ${selectedClients.length} invoices`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="opacity-70"><GearLoader size="md" /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Show empty state if no clients selected and no URL params
  if (selectedClientIds.length === 0 && !clientIdsParam) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Clients Selected</h2>
              <p className="text-muted-foreground mb-4">
                Select clients from the Clients page to create batch invoices, or use tags to quickly select groups of clients.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/clients">
                  <Button>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go to Clients
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Create Batch Invoices</h1>
              <p className="text-muted-foreground">
                Create invoices for {selectedClients.length} selected client{selectedClients.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {/* Template Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Load Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>

        {showResults ? (
          /* Results View */
          <Card>
            <CardHeader>
              <CardTitle>Batch Creation Results</CardTitle>
              <CardDescription>
                {isCreating ? 'Creating invoices...' : 'Invoice creation complete'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {batchResults.map(result => (
                  <div 
                    key={result.clientId}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'pending' && (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                      {result.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {result.status === 'error' && (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">{result.clientName}</p>
                        {result.invoiceNumber && (
                          <p className="text-sm text-muted-foreground">{result.invoiceNumber}</p>
                        )}
                        {result.error && (
                          <p className="text-sm text-destructive">{result.error}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={
                      result.status === 'success' ? 'default' :
                      result.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {result.status === 'pending' ? 'Creating...' :
                       result.status === 'success' ? 'Created' : 'Failed'}
                    </Badge>
                  </div>
                ))}
              </div>
              
              {!isCreating && (
                <div className="flex gap-3 mt-6">
                  <Link href="/invoices">
                    <Button>View All Invoices</Button>
                  </Link>
                  <Button variant="outline" onClick={() => {
                    setShowResults(false);
                    setBatchResults([]);
                  }}>
                    Create More
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Form View */
          <div className="space-y-6">
            {/* Selected Clients with Tag Filter */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Selected Clients</CardTitle>
                  
                  {/* Tag Filter */}
                  {clientTags && clientTags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Select value={selectedTagId?.toString() || 'none'} onValueChange={handleTagSelect}>
                        <SelectTrigger className="w-[180px]">
                          <Tag className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Add by tag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select a tag...</SelectItem>
                          {clientTags.map(tag => (
                            <SelectItem key={tag.id} value={tag.id.toString()}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: tag.color }}
                                />
                                {tag.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedTagId && (
                        <Button 
                          size="sm" 
                          onClick={handleAddClientsFromTag}
                          disabled={isLoadingClientsByTag || !clientsByTag?.length}
                        >
                          {isLoadingClientsByTag ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>Add {clientsByTag?.length || 0} Client{(clientsByTag?.length || 0) !== 1 ? 's' : ''}</>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedClients.map(client => (
                    <Badge 
                      key={client.id} 
                      variant="secondary" 
                      className="text-sm pr-1 flex items-center gap-1"
                    >
                      {client.name}
                      <button
                        onClick={() => handleRemoveClient(client.id)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {selectedClients.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No clients selected. Use the tag filter above to add clients.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Line Items</CardTitle>
                <CardDescription>
                  These items will be added to all {selectedClients.length} invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      {index === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Service or product description"
                      />
                    </div>
                    <div className="col-span-2">
                      {index === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-3">
                      {index === 0 && <Label className="text-xs text-muted-foreground">Rate</Label>}
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        <Currency amount={item.quantity * item.rate} currency={settings?.currency || 'USD'} />
                      </span>
                      {lineItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" onClick={addLineItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line Item
                </Button>

                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Per Invoice Total</p>
                    <p className="text-xl font-bold">
                      <Currency amount={lineItemsTotal} currency={settings?.currency || 'USD'} />
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Total for {selectedClients.length} invoices: {' '}
                      <span className="font-semibold text-foreground">
                        <Currency amount={totalForAllClients} currency={settings?.currency || 'USD'} />
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due In</Label>
                    <Select 
                      value={dueInDays.toString()} 
                      onValueChange={(v) => setDueInDays(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="45">45 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select 
                      value={templateId?.toString() || ''} 
                      onValueChange={(v) => setTemplateId(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map(template => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name} {template.isDefault && '(Default)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v: 'draft' | 'sent') => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes to include on all invoices"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Link href="/clients">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button 
                onClick={handleCreateBatch} 
                disabled={isCreating || selectedClients.length === 0}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Create {selectedClients.length} Invoice{selectedClients.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
      
      {/* Template Dialogs */}
      <SaveBatchTemplateDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveTemplate}
        lineItems={lineItems}
        dueInDays={dueInDays}
        notes={notes}
        isLoading={isSavingTemplate}
      />
      
      <LoadBatchTemplateDialog
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        templates={(batchTemplates || []).map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          frequency: t.frequency as 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
          dueInDays: t.dueInDays,
          usageCount: t.usageCount,
          lastUsedAt: t.lastUsedAt,
        }))}
        onLoad={handleLoadTemplate}
        onDelete={handleDeleteTemplate}
        deletingId={deletingTemplateId}
      />
    </div>
  );
}
