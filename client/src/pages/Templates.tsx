import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Plus, Eye, Edit, Trash2, Check, Palette, Type, Layout, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { TemplatePreview } from "@/components/templates/TemplatePreview";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InvoiceTemplates() {

  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const { data: templates, isLoading, refetch } = trpc.templates.list.useQuery();
  const setDefaultMutation = trpc.templates.setDefault.useMutation();
  const deleteMutation = trpc.templates.delete.useMutation();
  const initializeMutation = trpc.templates.initializeTemplates.useMutation();
  
  // Auto-initialize templates if user doesn't have the preset templates
  useEffect(() => {
    if (!isLoading && templates && !isInitializing) {
      // Check if user has any of the 6 preset templates
      const presetNames = ["Modern", "Classic", "Minimal", "Bold", "Professional", "Creative"];
      const hasPresets = templates.some(t => presetNames.includes(t.name));
      
      // If user has no preset templates, initialize them
      if (!hasPresets) {
        setIsInitializing(true);
        initializeMutation.mutate(undefined, {
          onSuccess: (data) => {
            toast.success(`${data.count} templates initialized`);
            refetch();
            setIsInitializing(false);
          },
          onError: () => {
            toast.error("Failed to initialize templates");
            setIsInitializing(false);
          },
        });
      }
    }
  }, [isLoading, templates, isInitializing]);

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  const handleSetDefault = async (templateId: number) => {
    try {
      await setDefaultMutation.mutateAsync({ id: templateId });
      toast.success("Default template updated");
      refetch();
    } catch (error) {
      toast.error("Failed to set default template");
    }
  };

  const handleDelete = async () => {
    if (!deleteTemplateId) return;

    try {
      await deleteMutation.mutateAsync({ id: deleteTemplateId });
      toast.success("Template deleted");
      refetch();
      setDeleteTemplateId(null);
      if (selectedTemplateId === deleteTemplateId) {
        setSelectedTemplateId(null);
        setIsEditing(false);
        setIsPreviewing(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
      setDeleteTemplateId(null);
    }
  };

  const handleEditComplete = () => {
    setIsEditing(false);
    setSelectedTemplateId(null);
    refetch();
  };

  if (isEditing && selectedTemplateId) {
    return (
      <TemplateEditor
        templateId={selectedTemplateId}
        onComplete={handleEditComplete}
        onCancel={() => {
          setIsEditing(false);
          setSelectedTemplateId(null);
        }}
      />
    );
  }

  if (isPreviewing && selectedTemplate) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold">{selectedTemplate.name} - Preview</h1>
              <p className="text-sm text-muted-foreground">Preview how your invoices will look</p>
            </div>
            <Button onClick={() => setIsPreviewing(false)} variant="outline">
              Close Preview
            </Button>
          </div>
        </div>
        <div className="container py-8">
          <TemplatePreview template={selectedTemplate} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <img src="/SleekInvoices-Wide.svg" alt="SleekInvoices" className="h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Invoice Templates</h1>
              <p className="text-sm text-muted-foreground">Customize your invoice appearance</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setSelectedTemplateId(null);
              setIsEditing(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="relative overflow-hidden group">
                {template.isDefault && (
                  <Badge className="absolute top-4 right-4 z-10 bg-primary">
                    <Check className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
                
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" style={{ color: template.primaryColor }} />
                    {template.name}
                  </CardTitle>
                  <CardDescription className="capitalize">
                    {template.templateType} style
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Template Preview Thumbnail */}
                  <div 
                    className="h-40 border rounded-lg overflow-hidden bg-white cursor-pointer hover:border-primary transition-colors"
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      setIsPreviewing(true);
                    }}
                  >
                    <div className="p-4 space-y-2">
                      <div 
                        className="h-8 rounded"
                        style={{ backgroundColor: template.primaryColor, opacity: 0.1 }}
                      />
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-200 rounded w-3/4" />
                        <div className="h-2 bg-gray-200 rounded w-1/2" />
                      </div>
                      <div className="space-y-1 pt-2">
                        <div className="h-2 bg-gray-100 rounded" />
                        <div className="h-2 bg-gray-100 rounded" />
                        <div className="h-2 bg-gray-100 rounded w-2/3" />
                      </div>
                    </div>
                  </div>

                  {/* Template Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Type className="h-4 w-4" />
                      <span>{template.headingFont || template.bodyFont}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layout className="h-4 w-4" />
                      <span className="capitalize">{template.headerLayout} header</span>
                    </div>
                    <div className="flex gap-2">
                      <div 
                        className="h-6 w-6 rounded border"
                        style={{ backgroundColor: template.primaryColor }}
                        title="Primary color"
                      />
                      <div 
                        className="h-6 w-6 rounded border"
                        style={{ backgroundColor: template.secondaryColor }}
                        title="Secondary color"
                      />
                      <div 
                        className="h-6 w-6 rounded border"
                        style={{ backgroundColor: template.accentColor }}
                        title="Accent color"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setIsPreviewing(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    {!template.isDefault && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => handleSetDefault(template.id)}
                        disabled={setDefaultMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteTemplateId(template.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <SettingsIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first invoice template to customize how your invoices look
              </p>
              <Button
                onClick={() => {
                  setSelectedTemplateId(null);
                  setIsEditing(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
