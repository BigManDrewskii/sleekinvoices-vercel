import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

interface SaveBatchTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    description: string;
    frequency: 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  }) => Promise<void>;
  lineItems: LineItem[];
  dueInDays: number;
  notes: string;
  isLoading?: boolean;
}

export function SaveBatchTemplateDialog({
  open,
  onOpenChange,
  onSave,
  lineItems,
  dueInDays,
  notes,
  isLoading = false,
}: SaveBatchTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave({ name: name.trim(), description: description.trim(), frequency });
    setName("");
    setDescription("");
    setFrequency('monthly');
  };

  const validLineItems = lineItems.filter(item => item.description && item.rate > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save this batch configuration as a reusable template for future invoicing.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monthly Retainer, Quarterly Consulting"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template-description">Description (optional)</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this template is for"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="frequency">Billing Frequency</Label>
            <Select value={frequency} onValueChange={(v: typeof frequency) => setFrequency(v)}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">One-time</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm font-medium mb-2">Template will include:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {validLineItems.length} line item{validLineItems.length !== 1 ? 's' : ''}</li>
              <li>• Due in {dueInDays} days</li>
              {notes && <li>• Notes: "{notes.substring(0, 50)}{notes.length > 50 ? '...' : ''}"</li>}
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BatchTemplate {
  id: number;
  name: string;
  description: string | null;
  frequency: 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dueInDays: number;
  usageCount: number;
  lastUsedAt: Date | null;
}

interface LoadBatchTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: BatchTemplate[];
  onLoad: (templateId: number) => void;
  onDelete: (templateId: number) => Promise<void>;
  isLoading?: boolean;
  deletingId?: number | null;
}

export function LoadBatchTemplateDialog({
  open,
  onOpenChange,
  templates,
  onLoad,
  onDelete,
  isLoading = false,
  deletingId = null,
}: LoadBatchTemplateDialogProps) {
  const frequencyLabels: Record<string, string> = {
    'one-time': 'One-time',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'yearly': 'Yearly',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Load Template</DialogTitle>
          <DialogDescription>
            Select a saved template to populate the batch invoice form.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No saved templates yet.</p>
              <p className="text-sm mt-1">Create a batch invoice and save it as a template to get started.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{template.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {frequencyLabels[template.frequency]}
                      </span>
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground truncate">{template.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Due in {template.dueInDays} days • Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(template.id)}
                      disabled={deletingId === template.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {deletingId === template.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Delete'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        onLoad(template.id);
                        onOpenChange(false);
                      }}
                    >
                      Load
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
