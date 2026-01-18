import { useState } from "react";
import { Link } from "wouter";
import { Plus, Edit, Trash2, Star, Sparkles, Palette } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SleekTemplateEditor } from "@/components/templates/SleekTemplateEditor";
import {
  TemplatePreviewCard,
  CompactTemplatePreview,
} from "@/components/templates/TemplatePreviewCard";
import { Badge } from "@/components/ui/badge";
import { TemplatesPageSkeleton } from "@/components/skeletons/TemplatesPageSkeleton";
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

/**
 * Invoice Templates Management Page
 *
 * Focused on the single "Sleek - Default" template with full customization
 * Users can create custom variations based on the Sleek template
 */
export default function InvoiceTemplates() {
  // UI State
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);

  // Data & Mutations
  const {
    data: templates,
    isLoading,
    refetch,
  } = trpc.templates.list.useQuery();
  const setDefaultMutation = trpc.templates.setDefault.useMutation();
  const deleteMutation = trpc.templates.delete.useMutation();
  const initializeMutation = trpc.templates.initializeTemplates.useMutation();

  // Find the Sleek - Default template
  const sleekTemplate = templates?.find(t =>
    t.name.toLowerCase().includes("sleek")
  );
  const customTemplates =
    templates?.filter(t => !t.name.toLowerCase().includes("sleek")) || [];

  /**
   * Handle manual template initialization
   */
  const handleInitializeTemplates = async () => {
    try {
      await initializeMutation.mutateAsync();
      toast.success("Sleek - Default template created successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create template");
    }
  };

  /**
   * Handle setting a template as default
   */
  const handleSetDefault = async (templateId: number) => {
    try {
      await setDefaultMutation.mutateAsync({ id: templateId });
      toast.success("Default template updated");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to set default template");
    }
  };

  /**
   * Handle template deletion
   */
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
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
      setDeleteTemplateId(null);
    }
  };

  /**
   * Handle template editor completion
   */
  const handleEditComplete = () => {
    setIsEditing(false);
    setSelectedTemplateId(null);
    refetch();
  };

  // Show template editor when editing
  if (isEditing) {
    return (
      <SleekTemplateEditor
        templateId={selectedTemplateId}
        onComplete={handleEditComplete}
        onCancel={() => {
          setIsEditing(false);
          setSelectedTemplateId(null);
        }}
      />
    );
  }

  return (
    <div className="page-wrapper">
      <Navigation />

      {/* Page Content */}
      <div className="page-content page-transition">
        {/* Page Header */}
        <div className="page-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="page-header-title">Templates</h1>
              <p className="page-header-subtitle">
                Customize your invoice style
              </p>
            </div>
            {templates && templates.length > 0 && (
              <Button
                onClick={() => {
                  setSelectedTemplateId(null);
                  setIsEditing(true);
                }}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">New Variation</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="section-stack">
          {isLoading ? (
            // Loading State
            <TemplatesPageSkeleton />
          ) : !templates || templates.length === 0 ? (
            // Empty State - No templates at all
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-full max-w-md text-center space-y-8">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Palette className="h-10 w-10 text-primary" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold">Welcome to Templates</h2>
                  <p className="text-muted-foreground">
                    Create beautiful, professional invoices with our
                    customizable Sleek template
                  </p>
                </div>

                <Button
                  onClick={handleInitializeTemplates}
                  disabled={initializeMutation.isPending}
                  size="lg"
                >
                  {initializeMutation.isPending ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Get Started
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Has templates
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Main Sleek Template */}
              {sleekTemplate && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold">Your Template</h2>
                    </div>
                    {sleekTemplate.isDefault && (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary"
                      >
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Default
                      </Badge>
                    )}
                  </div>

                  <Card className="overflow-hidden">
                    <div className="grid md:grid-cols-5 gap-0">
                      {/* Preview Card - 3 columns */}
                      <div className="md:col-span-3 p-6 bg-muted/20">
                        <TemplatePreviewCard
                          template={sleekTemplate}
                          size="lg"
                          onClick={() => {
                            setSelectedTemplateId(sleekTemplate.id);
                            setIsEditing(true);
                          }}
                        />
                      </div>

                      {/* Info & Actions - 2 columns */}
                      <div className="md:col-span-2 p-6 flex flex-col">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">
                            {sleekTemplate.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Fully customizable with Google Fonts and brand
                            colors
                          </p>

                          {/* Quick stats */}
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Font
                              </span>
                              <span className="font-medium">
                                {sleekTemplate.headingFont}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Colors
                              </span>
                              <div className="flex gap-1">
                                <div
                                  className="w-4 h-4 rounded-full ring-1 ring-black/10"
                                  style={{
                                    backgroundColor: sleekTemplate.primaryColor,
                                  }}
                                />
                                <div
                                  className="w-4 h-4 rounded-full ring-1 ring-black/10"
                                  style={{
                                    backgroundColor:
                                      sleekTemplate.secondaryColor,
                                  }}
                                />
                                <div
                                  className="w-4 h-4 rounded-full ring-1 ring-black/10"
                                  style={{
                                    backgroundColor: sleekTemplate.accentColor,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <Button
                            onClick={() => {
                              setSelectedTemplateId(sleekTemplate.id);
                              setIsEditing(true);
                            }}
                            className="w-full"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Customize
                          </Button>
                          {!sleekTemplate.isDefault && (
                            <Button
                              onClick={() => handleSetDefault(sleekTemplate.id)}
                              variant="outline"
                              className="w-full"
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Set as Default
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* No Sleek template - show option to create */}
              {!sleekTemplate && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Get the Sleek Template
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create the official Sleek template with full customization
                  </p>
                  <Button
                    onClick={handleInitializeTemplates}
                    disabled={initializeMutation.isPending}
                  >
                    {initializeMutation.isPending
                      ? "Creating..."
                      : "Create Sleek Template"}
                  </Button>
                </div>
              )}

              {/* Custom Variations */}
              {customTemplates.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Your Variations
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {customTemplates.map(template => (
                      <Card key={template.id} className="overflow-hidden">
                        <div className="p-3">
                          <CompactTemplatePreview
                            template={template}
                            onClick={() => {
                              setSelectedTemplateId(template.id);
                              setIsEditing(true);
                            }}
                          />
                        </div>

                        <CardHeader className="pt-0 pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              {template.name}
                              {template.isDefault && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  Default
                                </Badge>
                              )}
                            </CardTitle>
                          </div>
                          <CardDescription className="text-xs">
                            {template.headingFont}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-0 pb-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 text-xs"
                              onClick={() => {
                                setSelectedTemplateId(template.id);
                                setIsEditing(true);
                              }}
                            >
                              <Edit
                                className="h-3 w-3 mr-1"
                                aria-hidden="true"
                              />
                              Edit
                            </Button>
                            {!template.isDefault && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  onClick={() => handleSetDefault(template.id)}
                                  aria-label={`Set ${template.name} as default`}
                                >
                                  <Star
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setDeleteTemplateId(template.id)
                                  }
                                  aria-label={`Delete ${template.name}`}
                                >
                                  <Trash2
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteTemplateId}
          onOpenChange={() => setDeleteTemplateId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This template will be permanently
                deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
