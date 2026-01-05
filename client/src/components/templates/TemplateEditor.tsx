import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TEMPLATE_PRESETS } from "@shared/template-presets";
import { TemplatePreview } from "./TemplatePreview";
import { CollapsibleSection, ColorInput, SliderInput } from "@/components/ui/collapsible-section";
import { applyHSLAdjustments, hexToHSL, type HSLAdjustments } from "@/lib/hsl-utils";

interface TemplateEditorProps {
  templateId?: number | null;
  onComplete: () => void;
  onCancel: () => void;
}

// Extended color presets grid
const COLOR_PRESETS = [
  '#fbbf24', '#22c55e', '#a855f7', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#84cc16',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa', '#64748b',
  '#94a3b8', '#cbd5e1', '#1e293b', '#0f172a',
];

export function TemplateEditor({ templateId, onComplete, onCancel }: TemplateEditorProps) {
  const isNew = !templateId;

  const { data: existingTemplate } = trpc.templates.get.useQuery(
    { id: templateId! },
    { enabled: !!templateId }
  );

  const createMutation = trpc.templates.create.useMutation();
  const updateMutation = trpc.templates.update.useMutation();

  // Form state
  const [name, setName] = useState("");
  const [templateType, setTemplateType] = useState<string>("modern");
  const [primaryColor, setPrimaryColor] = useState("#5f6fff");
  const [primaryForeground, setPrimaryForeground] = useState("#ffffff");
  const [secondaryColor, setSecondaryColor] = useState("#252f33");
  const [secondaryForeground, setSecondaryForeground] = useState("#f1f6f9");
  const [accentColor, setAccentColor] = useState("#10b981");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [headingFont, setHeadingFont] = useState("Inter");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [fontSize, setFontSize] = useState(14);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [logoPosition, setLogoPosition] = useState<string>("left");
  const [logoWidth, setLogoWidth] = useState(150);
  const [headerLayout, setHeaderLayout] = useState<string>("standard");
  const [footerLayout, setFooterLayout] = useState<string>("simple");
  const [showCompanyAddress, setShowCompanyAddress] = useState(true);
  const [showPaymentTerms, setShowPaymentTerms] = useState(true);
  const [showTaxField, setShowTaxField] = useState(true);
  const [showDiscountField, setShowDiscountField] = useState(true);
  const [showNotesField, setShowNotesField] = useState(true);
  const [footerText, setFooterText] = useState("Thank you for your business!");
  const [language, setLanguage] = useState("en");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [isDefault, setIsDefault] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showColorPresets, setShowColorPresets] = useState(true);
  
  // HSL Adjustment state
  const [hueShift, setHueShift] = useState(0);
  const [saturationMult, setSaturationMult] = useState(1);
  const [lightnessMult, setLightnessMult] = useState(1);
  
  const { data: user } = trpc.auth.me.useQuery();
  
  // Compute adjusted colors based on HSL settings
  const hslAdjustments: HSLAdjustments = { hueShift, saturationMult, lightnessMult };
  const adjustedPrimaryColor = applyHSLAdjustments(primaryColor, hslAdjustments);
  const adjustedSecondaryColor = applyHSLAdjustments(secondaryColor, hslAdjustments);
  const adjustedAccentColor = applyHSLAdjustments(accentColor, hslAdjustments);
  const adjustedBackgroundColor = applyHSLAdjustments(backgroundColor, hslAdjustments);

  // Handle logo file selection and upload
  const handleLogoFileChange = async (file: File | null) => {
    if (!file || !user) return;
    
    setIsUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        const response = await fetch('/api/upload/logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, userId: user.id }),
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const { url } = await response.json();
        setLogoUrl(url);
        toast.success('Logo uploaded successfully');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Load existing template data
  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name);
      setTemplateType(existingTemplate.templateType);
      setPrimaryColor(existingTemplate.primaryColor);
      setSecondaryColor(existingTemplate.secondaryColor);
      setAccentColor(existingTemplate.accentColor);
      setHeadingFont(existingTemplate.headingFont);
      setBodyFont(existingTemplate.bodyFont);
      setFontSize(existingTemplate.fontSize);
      setLogoPosition(existingTemplate.logoPosition);
      setLogoWidth(existingTemplate.logoWidth);
      setHeaderLayout(existingTemplate.headerLayout);
      setFooterLayout(existingTemplate.footerLayout);
      setShowCompanyAddress(existingTemplate.showCompanyAddress);
      setShowPaymentTerms(existingTemplate.showPaymentTerms);
      setShowTaxField(existingTemplate.showTaxField);
      setShowDiscountField(existingTemplate.showDiscountField);
      setShowNotesField(existingTemplate.showNotesField);
      setFooterText(existingTemplate.footerText || "");
      setLanguage(existingTemplate.language);
      setDateFormat(existingTemplate.dateFormat);
      setIsDefault(existingTemplate.isDefault);
      setLogoUrl(existingTemplate.logoUrl || null);
    }
  }, [existingTemplate]);

  // Apply preset when template type changes (only for new templates)
  useEffect(() => {
    if (isNew) {
      const preset = TEMPLATE_PRESETS.find(p => p.templateType === templateType);
      if (preset) {
        setPrimaryColor(preset.primaryColor);
        setSecondaryColor(preset.secondaryColor);
        setAccentColor(preset.accentColor);
        setHeadingFont(preset.headingFont);
        setBodyFont(preset.bodyFont);
        setFontSize(preset.fontSize);
        setLogoPosition(preset.logoPosition);
        setLogoWidth(preset.logoWidth);
        setHeaderLayout(preset.headerLayout);
        setFooterLayout(preset.footerLayout);
        setShowCompanyAddress(preset.showCompanyAddress);
        setShowPaymentTerms(preset.showPaymentTerms);
        setShowTaxField(preset.showTaxField);
        setShowDiscountField(preset.showDiscountField);
        setShowNotesField(preset.showNotesField);
        setFooterText(preset.footerText);
        setLanguage(preset.language);
        setDateFormat(preset.dateFormat);
      }
    }
  }, [templateType, isNew]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const templateData = {
      name,
      templateType: templateType as any,
      primaryColor: adjustedPrimaryColor,
      secondaryColor: adjustedSecondaryColor,
      accentColor: adjustedAccentColor,
      headingFont,
      bodyFont,
      fontSize,
      logoUrl: logoUrl || undefined,
      logoPosition: logoPosition as any,
      logoWidth,
      headerLayout: headerLayout as any,
      footerLayout: footerLayout as any,
      showCompanyAddress,
      showPaymentTerms,
      showTaxField,
      showDiscountField,
      showNotesField,
      footerText,
      language,
      dateFormat,
      isDefault,
    };

    try {
      if (isNew) {
        await createMutation.mutateAsync(templateData);
        toast.success("Template created successfully");
      } else {
        await updateMutation.mutateAsync({
          id: templateId!,
          ...templateData,
        });
        toast.success("Template updated successfully");
      }
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to save template");
    }
  };

  const currentTemplate = {
    id: templateId || 0,
    userId: 0,
    name,
    templateType: templateType as any,
    primaryColor: adjustedPrimaryColor,
    secondaryColor: adjustedSecondaryColor,
    accentColor: adjustedAccentColor,
    headingFont,
    bodyFont,
    fontSize,
    logoUrl: logoUrl || undefined,
    logoPosition: logoPosition as any,
    logoWidth,
    headerLayout: headerLayout as any,
    footerLayout: footerLayout as any,
    showCompanyAddress,
    showPaymentTerms,
    showTaxField,
    showDiscountField,
    showNotesField,
    footerText,
    language,
    dateFormat,
    isDefault,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {isNew ? "Create Template" : "Edit Template"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Customize your invoice appearance
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          {/* Editor Panel - Scrollable */}
          <div className="space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 scrollbar-thin">
            {/* Basic Info */}
            <CollapsibleSection title="Basic Information" defaultOpen={true}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Template Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., My Custom Template"
                    className="h-9 bg-muted/30 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Template Style</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger className="h-9 bg-muted/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-1">
                  <Label className="text-sm">Set as default</Label>
                  <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                </div>
              </div>
            </CollapsibleSection>

            {/* Color Presets */}
            <CollapsibleSection title="Color Presets" defaultOpen={true}>
              <div className="space-y-3">
                <div className="grid grid-cols-10 gap-1.5">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPrimaryColor(color)}
                      className="w-full aspect-square rounded-md transition-transform hover:scale-110 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowColorPresets(!showColorPresets)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  {showColorPresets ? "Hide" : "Show"} presets
                </button>
              </div>
            </CollapsibleSection>

            {/* Primary Colors */}
            <CollapsibleSection title="Primary Colors" defaultOpen={true}>
              <div className="space-y-4">
                <ColorInput
                  label="Primary"
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  showSwap
                />
                <ColorInput
                  label="Primary Foreground"
                  value={primaryForeground}
                  onChange={setPrimaryForeground}
                  showSwap
                />
              </div>
            </CollapsibleSection>

            {/* Secondary Colors */}
            <CollapsibleSection title="Secondary Colors" defaultOpen={true}>
              <div className="space-y-4">
                <ColorInput
                  label="Secondary"
                  value={secondaryColor}
                  onChange={setSecondaryColor}
                  showSwap
                />
                <ColorInput
                  label="Secondary Foreground"
                  value={secondaryForeground}
                  onChange={setSecondaryForeground}
                  showSwap
                />
              </div>
            </CollapsibleSection>

            {/* Accent & Background */}
            <CollapsibleSection title="Accent & Background" defaultOpen={true}>
              <div className="space-y-4">
                <ColorInput
                  label="Accent Color"
                  value={accentColor}
                  onChange={setAccentColor}
                />
                <ColorInput
                  label="Background Color"
                  value={backgroundColor}
                  onChange={setBackgroundColor}
                />
              </div>
            </CollapsibleSection>

            {/* HSL Adjustments */}
            <CollapsibleSection title="HSL Adjustments" defaultOpen={false}>
              <div className="space-y-5">
                {/* Color preview swatches showing before/after */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Preview (Original → Adjusted)</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex gap-1">
                        <div className="h-6 flex-1 rounded" style={{ backgroundColor: primaryColor }} title={`Original: ${primaryColor}`} />
                        <div className="h-6 flex-1 rounded ring-2 ring-primary/50" style={{ backgroundColor: adjustedPrimaryColor }} title={`Adjusted: ${adjustedPrimaryColor}`} />
                      </div>
                      <div className="flex gap-1">
                        <div className="h-6 flex-1 rounded" style={{ backgroundColor: secondaryColor }} title={`Original: ${secondaryColor}`} />
                        <div className="h-6 flex-1 rounded ring-2 ring-primary/50" style={{ backgroundColor: adjustedSecondaryColor }} title={`Adjusted: ${adjustedSecondaryColor}`} />
                      </div>
                      <div className="flex gap-1">
                        <div className="h-6 flex-1 rounded" style={{ backgroundColor: accentColor }} title={`Original: ${accentColor}`} />
                        <div className="h-6 flex-1 rounded ring-2 ring-primary/50" style={{ backgroundColor: adjustedAccentColor }} title={`Adjusted: ${adjustedAccentColor}`} />
                      </div>
                    </div>
                  </div>
                </div>

                <SliderInput
                  label="Hue Shift"
                  value={hueShift}
                  onChange={setHueShift}
                  min={-180}
                  max={180}
                  step={1}
                  unit="deg"
                />
                <SliderInput
                  label="Saturation Multiplier"
                  value={saturationMult}
                  onChange={setSaturationMult}
                  min={0}
                  max={2}
                  step={0.1}
                  unit="x"
                />
                <SliderInput
                  label="Lightness Multiplier"
                  value={lightnessMult}
                  onChange={setLightnessMult}
                  min={0}
                  max={2}
                  step={0.1}
                  unit="x"
                />

                {/* Reset button */}
                <button
                  type="button"
                  onClick={() => {
                    setHueShift(0);
                    setSaturationMult(1);
                    setLightnessMult(1);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reset to defaults
                </button>
              </div>
            </CollapsibleSection>

            {/* Font Family */}
            <CollapsibleSection title="Font Family" defaultOpen={false}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Sans-Serif Font</Label>
                  <Select value={headingFont} onValueChange={setHeadingFont}>
                    <SelectTrigger className="h-9 bg-muted/30 border-border/50">
                      <SelectValue placeholder="Choose a sans-serif font..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Serif Font</Label>
                  <Select value={bodyFont} onValueChange={setBodyFont}>
                    <SelectTrigger className="h-9 bg-muted/30 border-border/50">
                      <SelectValue placeholder="Choose a serif font..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Merriweather">Merriweather</SelectItem>
                      <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Monospace Font</Label>
                  <Select defaultValue="monospace">
                    <SelectTrigger className="h-9 bg-muted/30 border-border/50">
                      <SelectValue placeholder="Choose a monospace font..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monospace">System Monospace</SelectItem>
                      <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                      <SelectItem value="Fira Code">Fira Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleSection>

            {/* Typography Settings */}
            <CollapsibleSection title="Typography Settings" defaultOpen={false}>
              <div className="space-y-5">
                <SliderInput
                  label="Font Size"
                  value={fontSize}
                  onChange={setFontSize}
                  min={10}
                  max={20}
                  unit="px"
                />
                <SliderInput
                  label="Letter Spacing"
                  value={letterSpacing}
                  onChange={setLetterSpacing}
                  min={-2}
                  max={10}
                  step={0.5}
                  unit="em"
                />
                <SliderInput
                  label="Line Height"
                  value={lineHeight}
                  onChange={setLineHeight}
                  min={1}
                  max={2.5}
                  step={0.1}
                  unit="x"
                />
              </div>
            </CollapsibleSection>

            {/* Layout Options */}
            <CollapsibleSection title="Layout Options" defaultOpen={false}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Header Layout</Label>
                  <Select value={headerLayout} onValueChange={setHeaderLayout}>
                    <SelectTrigger className="h-9 bg-muted/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="centered">Centered</SelectItem>
                      <SelectItem value="split">Split</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Footer Layout</Label>
                  <Select value={footerLayout} onValueChange={setFooterLayout}>
                    <SelectTrigger className="h-9 bg-muted/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Logo Position</Label>
                  <Select value={logoPosition} onValueChange={setLogoPosition}>
                    <SelectTrigger className="h-9 bg-muted/30 border-border/50">
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
                  label="Logo Width"
                  value={logoWidth}
                  onChange={setLogoWidth}
                  min={80}
                  max={300}
                  unit="px"
                />
              </div>
            </CollapsibleSection>

            {/* Logo Upload */}
            <CollapsibleSection title="Company Logo" defaultOpen={false}>
              <div className="space-y-3">
                <input
                  id="logoUpload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoFileChange(file);
                  }}
                  className="hidden"
                />
                
                {logoUrl ? (
                  <div className="relative group">
                    <img 
                      src={logoUrl} 
                      alt="Logo preview" 
                      className="w-full h-24 object-contain bg-muted/30 rounded-lg border border-border/50"
                    />
                    <button
                      type="button"
                      onClick={() => setLogoUrl(null)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => document.getElementById('logoUpload')?.click()}
                    disabled={isUploadingLogo}
                    className="w-full h-24 border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/20 transition-colors"
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Click to upload logo</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </CollapsibleSection>

            {/* Field Visibility */}
            <CollapsibleSection title="Field Visibility" defaultOpen={false}>
              <div className="space-y-3">
                {[
                  { id: 'showCompanyAddress', label: 'Company Address', value: showCompanyAddress, onChange: setShowCompanyAddress },
                  { id: 'showPaymentTerms', label: 'Payment Terms', value: showPaymentTerms, onChange: setShowPaymentTerms },
                  { id: 'showTaxField', label: 'Tax Field', value: showTaxField, onChange: setShowTaxField },
                  { id: 'showDiscountField', label: 'Discount Field', value: showDiscountField, onChange: setShowDiscountField },
                  { id: 'showNotesField', label: 'Notes Field', value: showNotesField, onChange: setShowNotesField },
                ].map((field) => (
                  <div key={field.id} className="flex items-center justify-between py-1">
                    <Label className="text-sm">{field.label}</Label>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Date & Footer */}
            <CollapsibleSection title="Date & Footer" defaultOpen={false}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger className="h-9 bg-muted/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Footer Text</Label>
                  <Textarea
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Thank you for your business!"
                    rows={2}
                    className="bg-muted/30 border-border/50 resize-none"
                  />
                </div>
              </div>
            </CollapsibleSection>
          </div>

          {/* Preview Panel - Fixed */}
          <div className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-96px)]">
            <div className="h-full rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
                <h3 className="text-sm font-medium">Live Preview</h3>
                <p className="text-xs text-muted-foreground">See how your invoice will look</p>
              </div>
              <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: backgroundColor + '10' }}>
                <div className="transform scale-[0.85] origin-top">
                  <TemplatePreview template={currentTemplate} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
