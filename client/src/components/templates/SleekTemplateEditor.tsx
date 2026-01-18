import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  Upload,
  X,
  RotateCcw,
  Receipt,
  FileText,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { FloppyDisk } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CollapsibleSection,
  ColorInput,
  SliderInput,
} from "@/components/ui/collapsible-section";
import { GoogleFontPicker } from "@/components/ui/google-font-picker";
import {
  SleekDefaultTemplate,
  defaultSleekSettings,
  type SleekTemplateSettings,
} from "./SleekDefaultTemplate";
import { loadGoogleFont } from "@/lib/google-fonts";
import { ReceiptStyleInvoice } from "@/components/invoices/ReceiptStyleInvoice";
import { ClassicStyleInvoice } from "@/components/invoices/ClassicStyleInvoice";
import { cn } from "@/lib/utils";
import { generateAccentColor } from "@/lib/color-contrast";

interface SleekTemplateEditorProps {
  templateId?: number | null;
  onComplete: () => void;
  onCancel: () => void;
}

type InvoiceStyle = "receipt" | "classic";
type PreviewDevice = "desktop" | "tablet" | "mobile";

// Brand color presets - curated for professional invoices
// Accent colors are auto-generated from primary
const BRAND_PRESETS = [
  { name: "Ocean", primary: "#0ea5e9" },
  { name: "Forest", primary: "#22c55e" },
  { name: "Sunset", primary: "#f97316" },
  { name: "Berry", primary: "#a855f7" },
  { name: "Slate", primary: "#64748b" },
  { name: "Rose", primary: "#f43f5e" },
  { name: "Indigo", primary: "#6366f1" },
  { name: "Teal", primary: "#14b8a6" },
];

// Sample invoice data for preview
const sampleInvoiceData = {
  invoiceNumber: "INV-0042",
  clientName: "Acme Corporation",
  clientEmail: "billing@acme.com",
  clientAddress: "123 Business Ave\nSuite 100\nNew York, NY 10001",
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  lineItems: [
    { description: "Website Design & Development", quantity: 1, rate: 3500 },
    { description: "Brand Identity Package", quantity: 1, rate: 1500 },
    { description: "Monthly Hosting (12 months)", quantity: 12, rate: 49 },
  ],
  subtotal: 5588,
  discountAmount: 0,
  taxAmount: 447.04,
  taxRate: 8,
  total: 6035.04,
  notes: "Thank you for your business! Payment is due within 30 days.",
  paymentTerms: "Net 30",
  companyName: "Your Company",
  companyAddress: "456 Creative Blvd\nLos Angeles, CA 90001",
  companyEmail: "hello@yourcompany.com",
  companyPhone: "+1 (555) 123-4567",
  status: "sent",
};

export function SleekTemplateEditor({
  templateId,
  onComplete,
  onCancel,
}: SleekTemplateEditorProps) {
  const isNew = !templateId;

  const { data: existingTemplate } = trpc.templates.get.useQuery(
    { id: templateId! },
    { enabled: !!templateId }
  );

  const createMutation = trpc.templates.create.useMutation();
  const updateMutation = trpc.templates.update.useMutation();
  const utils = trpc.useUtils();

  // Settings state
  const [settings, setSettings] =
    useState<SleekTemplateSettings>(defaultSleekSettings);
  const [isDefault, setIsDefault] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Preview state
  const [invoiceStyle, setInvoiceStyle] = useState<InvoiceStyle>("receipt");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [showSidebar, setShowSidebar] = useState(true);

  const { data: user } = trpc.auth.me.useQuery();

  // Update a single setting
  const updateSetting = <K extends keyof SleekTemplateSettings>(
    key: K,
    value: SleekTemplateSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Handle logo file selection and upload
  const handleLogoUpload = async (file: File | null) => {
    if (!file || !user) return;

    setIsUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async e => {
        const base64 = (e.target?.result as string).split(",")[1];
        const response = await fetch("/api/upload/logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64, userId: user.id }),
        });

        if (!response.ok) throw new Error("Upload failed");

        const { url } = await response.json();
        updateSetting("logoUrl", url);
        toast.success("Logo uploaded successfully");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Load existing template data
  useEffect(() => {
    if (existingTemplate) {
      setSettings({
        name: existingTemplate.name,
        logoUrl: existingTemplate.logoUrl || null,
        logoPosition: existingTemplate.logoPosition as
          | "left"
          | "center"
          | "right",
        logoWidth: existingTemplate.logoWidth,
        primaryColor: existingTemplate.primaryColor,
        secondaryColor: existingTemplate.secondaryColor,
        accentColor: existingTemplate.accentColor,
        backgroundColor: "#ffffff",
        headingFont: existingTemplate.headingFont,
        bodyFont: existingTemplate.bodyFont,
        fontSize: existingTemplate.fontSize,
        tableStyle: "minimal",
        showCompanyAddress: existingTemplate.showCompanyAddress,
        showPaymentTerms: existingTemplate.showPaymentTerms,
        showTaxField: existingTemplate.showTaxField,
        showDiscountField: existingTemplate.showDiscountField,
        showNotesField: existingTemplate.showNotesField,
        footerText: existingTemplate.footerText || null,
        dateFormat: existingTemplate.dateFormat,
      });
      setIsDefault(existingTemplate.isDefault);
    }
  }, [existingTemplate]);

  // Preload fonts
  useEffect(() => {
    loadGoogleFont(settings.headingFont, ["400", "500", "600", "700"]);
    loadGoogleFont(settings.bodyFont, ["400", "500", "600", "700"]);
  }, [settings.headingFont, settings.bodyFont]);

  // Auto-generate accent color when primary changes
  useEffect(() => {
    const autoAccent = generateAccentColor(settings.primaryColor);
    if (autoAccent !== settings.accentColor) {
      updateSetting("accentColor", autoAccent);
    }
  }, [settings.primaryColor]);

  // Apply brand preset
  const applyPreset = (preset: (typeof BRAND_PRESETS)[0]) => {
    updateSetting("primaryColor", preset.primary);
    const autoAccent = generateAccentColor(preset.primary);
    updateSetting("accentColor", autoAccent);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setSettings(defaultSleekSettings);
    toast.success("Reset to default settings");
  };

  // Save handler
  const handleSave = async () => {
    if (!settings.name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const templateData = {
      name: settings.name,
      templateType: "modern" as const,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      headingFont: settings.headingFont,
      bodyFont: settings.bodyFont,
      fontSize: settings.fontSize,
      logoUrl: settings.logoUrl || undefined,
      logoPosition: settings.logoPosition,
      logoWidth: settings.logoWidth,
      footerLayout: "simple" as const,
      showCompanyAddress: settings.showCompanyAddress,
      showPaymentTerms: settings.showPaymentTerms,
      showTaxField: settings.showTaxField,
      showDiscountField: settings.showDiscountField,
      showNotesField: settings.showNotesField,
      footerText: settings.footerText || "",
      language: "en",
      dateFormat: settings.dateFormat,
      isDefault,
    };

    try {
      if (isNew) {
        await createMutation.mutateAsync(templateData);
        toast.success("Template created successfully");
      } else {
        await updateMutation.mutateAsync({ id: templateId!, ...templateData });
        toast.success("Template updated successfully");
      }
      utils.templates.list.invalidate();
      onComplete();
    } catch (error) {
      toast.error("Failed to save template");
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Get preview width based on device
  const getPreviewWidth = () => {
    switch (previewDevice) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      default:
        return "max-w-[900px]";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold truncate">
                {isNew ? "Create Template" : "Edit Template"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Customize your invoice appearance
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* Toggle Sidebar - Desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="hidden lg:flex"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showSidebar ? "Hide Editor" : "Show Editor"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="hidden sm:flex"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FloppyDisk weight="bold" className="h-4 w-4 mr-2" />
              )}
              <span className="hidden sm:inline">Save Template</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row">
        {/* Editor Sidebar */}
        <div
          className={cn(
            "md:w-[300px] lg:w-[380px] xl:w-[420px] border-r bg-muted/30 transition-all duration-300 shrink-0",
            showSidebar ? "block" : "hidden lg:hidden"
          )}
        >
          <div className="h-[calc(100vh-57px)] overflow-y-auto">
            <div className="p-4 space-y-2">
              {/* Brand Identity */}
              <CollapsibleSection title="Brand Identity" defaultOpen>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Template Name</Label>
                    <Input
                      value={settings.name}
                      onChange={e => updateSetting("name", e.target.value)}
                      placeholder="e.g., My Invoice Template"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Company Logo</Label>
                    <div className="mt-1.5">
                      {settings.logoUrl ? (
                        <div className="relative inline-block">
                          <img
                            src={settings.logoUrl}
                            alt="Logo"
                            className="h-16 rounded border bg-white p-2"
                          />
                          <button
                            onClick={() => updateSetting("logoUrl", null)}
                            className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full text-white hover:bg-destructive/90"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-2 pb-3">
                            {isUploadingLogo ? (
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                <p className="text-xs text-muted-foreground">
                                  Click to upload logo
                                </p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={e =>
                              handleLogoUpload(e.target.files?.[0] || null)
                            }
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {settings.logoUrl && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">
                          Logo Position
                        </Label>
                        <Select
                          value={settings.logoPosition}
                          onValueChange={v =>
                            updateSetting(
                              "logoPosition",
                              v as "left" | "center" | "right"
                            )
                          }
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <SliderInput
                        label="Logo Size"
                        value={settings.logoWidth}
                        onChange={v => updateSetting("logoWidth", v)}
                        min={60}
                        max={200}
                        step={10}
                        unit="px"
                      />
                    </>
                  )}
                </div>
              </CollapsibleSection>

              {/* Colors */}
              <CollapsibleSection title="Colors" defaultOpen>
                <div className="space-y-4">
                  {/* Color Usage Info */}
                  {invoiceStyle === "receipt" && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        <strong className="font-medium">Receipt style</strong>{" "}
                        uses minimal colors: Primary for text/dividers, Accent
                        for totals/highlights.
                      </p>
                    </div>
                  )}

                  {/* Color Presets */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Quick Presets
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {BRAND_PRESETS.map(preset => {
                        const autoAccent = generateAccentColor(preset.primary);
                        return (
                          <button
                            key={preset.name}
                            onClick={() => applyPreset(preset)}
                            className="group relative aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition-all shadow-sm"
                            title={preset.name}
                          >
                            <div
                              className="absolute inset-0"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="text-[10px] text-white font-medium text-center">
                                {preset.name}
                              </div>
                              <div
                                className="w-full h-3 mt-0.5"
                                style={{ backgroundColor: autoAccent }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <ColorInput
                    label="Primary Color"
                    value={settings.primaryColor}
                    onChange={v => updateSetting("primaryColor", v)}
                  />
                  <ColorInput
                    label="Accent Color"
                    value={settings.accentColor}
                    onChange={v => updateSetting("accentColor", v)}
                    readonly={true}
                    subtitle="(Auto-generated)"
                  />
                </div>
              </CollapsibleSection>

              {/* Typography */}
              <CollapsibleSection title="Typography">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Heading Font</Label>
                    <GoogleFontPicker
                      value={settings.headingFont}
                      onFontChange={(v: string) =>
                        updateSetting("headingFont", v)
                      }
                      showWeightPicker={false}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Body Font</Label>
                    <GoogleFontPicker
                      value={settings.bodyFont}
                      onFontChange={(v: string) => updateSetting("bodyFont", v)}
                      showWeightPicker={false}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* Layout */}
              <CollapsibleSection title="Layout">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Date Format</Label>
                    <Select
                      value={settings.dateFormat}
                      onValueChange={v => updateSetting("dateFormat", v)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MMM DD, YYYY">
                          MMM DD, YYYY
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Field Visibility */}
              <CollapsibleSection title="Field Visibility">
                <div className="space-y-3">
                  {[
                    { key: "showCompanyAddress", label: "Company Address" },
                    { key: "showPaymentTerms", label: "Payment Terms" },
                    { key: "showTaxField", label: "Tax Field" },
                    { key: "showDiscountField", label: "Discount Field" },
                    { key: "showNotesField", label: "Notes Section" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <Label className="text-sm">{label}</Label>
                      <Switch
                        checked={
                          settings[
                            key as keyof SleekTemplateSettings
                          ] as boolean
                        }
                        onCheckedChange={v =>
                          updateSetting(
                            key as keyof SleekTemplateSettings,
                            v as any
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Footer */}
              <CollapsibleSection title="Footer">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">
                      Footer Message
                    </Label>
                    <Textarea
                      value={settings.footerText || ""}
                      onChange={e =>
                        updateSetting("footerText", e.target.value || null)
                      }
                      placeholder="Thank you for your business!"
                      className="mt-1.5 min-h-[80px]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Set as Default Template</Label>
                    <Switch
                      checked={isDefault}
                      onCheckedChange={setIsDefault}
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* Reset Button */}
              <div className="pt-4 pb-8">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resetToDefaults}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex-1 h-[calc(100vh-57px)] bg-muted/20 overflow-y-auto">
          {/* Preview Controls */}
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Style Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground mr-2">
                    Style:
                  </span>
                  <div className="flex bg-muted p-1 rounded-lg">
                    <button
                      onClick={() => setInvoiceStyle("receipt")}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                        invoiceStyle === "receipt"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Receipt className="h-4 w-4" />
                      <span className="hidden sm:inline">Receipt</span>
                    </button>
                    <button
                      onClick={() => setInvoiceStyle("classic")}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                        invoiceStyle === "classic"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Classic</span>
                    </button>
                  </div>
                </div>

                {/* Device Preview Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground mr-2 hidden sm:inline">
                    Preview:
                  </span>
                  <div className="flex bg-muted p-1 rounded-lg">
                    <button
                      onClick={() => setPreviewDevice("mobile")}
                      className={cn(
                        "p-1.5 rounded-md transition-all",
                        previewDevice === "mobile"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Mobile"
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice("tablet")}
                      className={cn(
                        "p-1.5 rounded-md transition-all",
                        previewDevice === "tablet"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Tablet"
                    >
                      <Tablet className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice("desktop")}
                      className={cn(
                        "p-1.5 rounded-md transition-all",
                        previewDevice === "desktop"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Desktop"
                    >
                      <Monitor className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Mobile: Toggle Editor */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="lg:hidden ml-2"
                  >
                    {showSidebar ? "Preview" : "Edit"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div
              className={cn(
                "mx-auto transition-all duration-300",
                getPreviewWidth()
              )}
            >
              <div className="bg-muted/50 rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg">
                <div className="shadow-[0_0_1px_rgba(0,0,0,0.1),0_8px_40px_rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
                  {invoiceStyle === "receipt" ? (
                    <ReceiptStyleInvoice
                      {...sampleInvoiceData}
                      logoUrl={settings.logoUrl || undefined}
                      logoPosition={settings.logoPosition}
                      logoWidth={settings.logoWidth}
                      primaryColor={settings.primaryColor}
                      accentColor={settings.accentColor}
                      headingFont={settings.headingFont}
                      bodyFont={settings.bodyFont}
                      fontSize={settings.fontSize}
                      dateFormat={settings.dateFormat}
                      showCompanyAddress={settings.showCompanyAddress}
                      showPaymentTerms={settings.showPaymentTerms}
                      showTaxField={settings.showTaxField}
                      showDiscountField={settings.showDiscountField}
                      showNotesField={settings.showNotesField}
                      footerText={settings.footerText || undefined}
                    />
                  ) : (
                    <ClassicStyleInvoice
                      {...sampleInvoiceData}
                      logoUrl={settings.logoUrl || undefined}
                      logoPosition={settings.logoPosition}
                      logoWidth={settings.logoWidth}
                      primaryColor={settings.primaryColor}
                      accentColor={settings.accentColor}
                      headingFont={settings.headingFont}
                      bodyFont={settings.bodyFont}
                      fontSize={settings.fontSize}
                      dateFormat={settings.dateFormat}
                      showCompanyAddress={settings.showCompanyAddress}
                      showPaymentTerms={settings.showPaymentTerms}
                      showTaxField={settings.showTaxField}
                      showDiscountField={settings.showDiscountField}
                      showNotesField={settings.showNotesField}
                      footerText={settings.footerText || undefined}
                    />
                  )}
                </div>
              </div>

              {/* Preview Info */}
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  {invoiceStyle === "receipt"
                    ? "Receipt Style"
                    : "Classic Style"}{" "}
                  •
                  {previewDevice === "mobile"
                    ? " Mobile"
                    : previewDevice === "tablet"
                      ? " Tablet"
                      : " Desktop"}{" "}
                  Preview
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This preview shows sample data. Your actual invoices will use
                  real client information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
