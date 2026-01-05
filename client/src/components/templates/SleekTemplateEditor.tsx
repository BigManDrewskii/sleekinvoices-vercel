import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Save, Loader2, Upload, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CollapsibleSection, ColorInput, SliderInput } from "@/components/ui/collapsible-section";
import { GoogleFontPicker } from "@/components/ui/google-font-picker";
import { SleekDefaultTemplate, defaultSleekSettings, type SleekTemplateSettings } from "./SleekDefaultTemplate";
import { loadGoogleFont } from "@/lib/google-fonts";

interface SleekTemplateEditorProps {
  templateId?: number | null;
  onComplete: () => void;
  onCancel: () => void;
}

// Brand color presets - curated for professional invoices
const BRAND_PRESETS = [
  { name: 'Ocean', primary: '#0ea5e9', secondary: '#0f172a', accent: '#22d3ee', bg: '#ffffff' },
  { name: 'Forest', primary: '#22c55e', secondary: '#14532d', accent: '#4ade80', bg: '#ffffff' },
  { name: 'Sunset', primary: '#f97316', secondary: '#431407', accent: '#fb923c', bg: '#ffffff' },
  { name: 'Berry', primary: '#a855f7', secondary: '#3b0764', accent: '#c084fc', bg: '#ffffff' },
  { name: 'Slate', primary: '#64748b', secondary: '#1e293b', accent: '#94a3b8', bg: '#ffffff' },
  { name: 'Rose', primary: '#f43f5e', secondary: '#4c0519', accent: '#fb7185', bg: '#ffffff' },
  { name: 'Indigo', primary: '#6366f1', secondary: '#1e1b4b', accent: '#818cf8', bg: '#ffffff' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#134e4a', accent: '#2dd4bf', bg: '#ffffff' },
  { name: 'Midnight', primary: '#8b5cf6', secondary: '#1e1b4b', accent: '#a78bfa', bg: '#0f172a' },
  { name: 'Charcoal', primary: '#f59e0b', secondary: '#fafafa', accent: '#fbbf24', bg: '#18181b' },
];

export function SleekTemplateEditor({ templateId, onComplete, onCancel }: SleekTemplateEditorProps) {
  const isNew = !templateId;

  const { data: existingTemplate } = trpc.templates.get.useQuery(
    { id: templateId! },
    { enabled: !!templateId }
  );

  const createMutation = trpc.templates.create.useMutation();
  const updateMutation = trpc.templates.update.useMutation();
  const utils = trpc.useUtils();

  // Settings state - using the SleekTemplateSettings interface
  const [settings, setSettings] = useState<SleekTemplateSettings>(defaultSleekSettings);
  const [isDefault, setIsDefault] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        const response = await fetch('/api/upload/logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, userId: user.id }),
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const { url } = await response.json();
        updateSetting('logoUrl', url);
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
      setSettings({
        name: existingTemplate.name,
        logoUrl: existingTemplate.logoUrl || null,
        logoPosition: existingTemplate.logoPosition as 'left' | 'center' | 'right',
        logoWidth: existingTemplate.logoWidth,
        primaryColor: existingTemplate.primaryColor,
        secondaryColor: existingTemplate.secondaryColor,
        accentColor: existingTemplate.accentColor,
        backgroundColor: '#ffffff', // Default if not stored
        headingFont: existingTemplate.headingFont,
        headingWeight: 600,
        bodyFont: existingTemplate.bodyFont,
        bodyWeight: 400,
        fontSize: existingTemplate.fontSize,
        headerLayout: existingTemplate.headerLayout as 'standard' | 'centered' | 'split',
        tableStyle: 'minimal',
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
    loadGoogleFont(settings.headingFont, ['400', '500', '600', '700']);
    loadGoogleFont(settings.bodyFont, ['400', '500', '600', '700']);
  }, [settings.headingFont, settings.bodyFont]);

  // Apply brand preset
  const applyPreset = (preset: typeof BRAND_PRESETS[0]) => {
    updateSetting('primaryColor', preset.primary);
    updateSetting('secondaryColor', preset.secondary);
    updateSetting('accentColor', preset.accent);
    updateSetting('backgroundColor', preset.bg);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setSettings(defaultSleekSettings);
    toast.success('Reset to default settings');
  };

  // Save handler
  const handleSave = async () => {
    if (!settings.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const templateData = {
      name: settings.name,
      templateType: 'modern' as const, // Sleek uses modern type
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      headingFont: settings.headingFont,
      bodyFont: settings.bodyFont,
      fontSize: settings.fontSize,
      logoUrl: settings.logoUrl || undefined,
      logoPosition: settings.logoPosition,
      logoWidth: settings.logoWidth,
      headerLayout: settings.headerLayout,
      footerLayout: 'simple' as const,
      showCompanyAddress: settings.showCompanyAddress,
      showPaymentTerms: settings.showPaymentTerms,
      showTaxField: settings.showTaxField,
      showDiscountField: settings.showDiscountField,
      showNotesField: settings.showNotesField,
      footerText: settings.footerText || '',
      language: 'en',
      dateFormat: settings.dateFormat,
      isDefault,
    };

    try {
      if (isNew) {
        await createMutation.mutateAsync(templateData);
        toast.success('Template created successfully');
      } else {
        await updateMutation.mutateAsync({ id: templateId!, ...templateData });
        toast.success('Template updated successfully');
      }
      utils.templates.list.invalidate();
      onComplete();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {isNew ? 'Create Template' : 'Edit Template'}
              </h1>
              <p className="text-sm text-slate-400">Sleek - Default</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Template
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Editor Sidebar */}
        <div className="w-[400px] h-[calc(100vh-73px)] overflow-y-auto border-r border-slate-800 bg-slate-900/50">
          <div className="p-4 space-y-2">
            
            {/* Brand Identity */}
            <CollapsibleSection title="Brand Identity" defaultOpen>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm">Template Name</Label>
                  <Input
                    value={settings.name}
                    onChange={(e) => updateSetting('name', e.target.value)}
                    placeholder="e.g., My Invoice Template"
                    className="mt-1.5 bg-slate-800/50 border-slate-700"
                  />
                </div>

                <div>
                  <Label className="text-slate-300 text-sm">Company Logo</Label>
                  <div className="mt-1.5">
                    {settings.logoUrl ? (
                      <div className="relative inline-block">
                        <img 
                          src={settings.logoUrl} 
                          alt="Logo" 
                          className="h-16 rounded border border-slate-700"
                        />
                        <button
                          onClick={() => updateSetting('logoUrl', null)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition-colors">
                        <Upload className="h-6 w-6 text-slate-500 mb-2" />
                        <span className="text-sm text-slate-500">
                          {isUploadingLogo ? 'Uploading...' : 'Click to upload'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)}
                          disabled={isUploadingLogo}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-300 text-sm">Logo Position</Label>
                    <Select
                      value={settings.logoPosition}
                      onValueChange={(v) => updateSetting('logoPosition', v as 'left' | 'center' | 'right')}
                    >
                      <SelectTrigger className="mt-1.5 bg-slate-800/50 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Logo Width</Label>
                    <Input
                      type="number"
                      value={settings.logoWidth}
                      onChange={(e) => updateSetting('logoWidth', parseInt(e.target.value) || 120)}
                      min={60}
                      max={300}
                      className="mt-1.5 bg-slate-800/50 border-slate-700"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Label className="text-slate-300 text-sm">Set as Default</Label>
                  <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                </div>
              </div>
            </CollapsibleSection>

            {/* Colors */}
            <CollapsibleSection title="Colors" defaultOpen>
              <div className="space-y-4">
                {/* Brand Presets */}
                <div>
                  <Label className="text-slate-300 text-sm mb-2 block">Quick Presets</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {BRAND_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className="group relative"
                        title={preset.name}
                      >
                        <div className="flex h-8 rounded-md overflow-hidden border border-slate-700 hover:border-slate-500 transition-colors">
                          <div className="flex-1" style={{ backgroundColor: preset.primary }} />
                          <div className="flex-1" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <ColorInput
                    label="Primary Color"
                    value={settings.primaryColor}
                    onChange={(v) => updateSetting('primaryColor', v)}
                  />
                  <ColorInput
                    label="Secondary Color"
                    value={settings.secondaryColor}
                    onChange={(v) => updateSetting('secondaryColor', v)}
                  />
                  <ColorInput
                    label="Accent Color"
                    value={settings.accentColor}
                    onChange={(v) => updateSetting('accentColor', v)}
                  />
                  <ColorInput
                    label="Background"
                    value={settings.backgroundColor}
                    onChange={(v) => updateSetting('backgroundColor', v)}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Typography */}
            <CollapsibleSection title="Typography" defaultOpen>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Heading Font</Label>
                  <GoogleFontPicker
                    value={settings.headingFont}
                    weight={settings.headingWeight}
                    onFontChange={(f) => updateSetting('headingFont', f)}
                    onWeightChange={(w) => updateSetting('headingWeight', w)}
                  />
                </div>

                <div>
                  <Label className="text-slate-300 text-sm mb-1.5 block">Body Font</Label>
                  <GoogleFontPicker
                    value={settings.bodyFont}
                    weight={settings.bodyWeight}
                    onFontChange={(f) => updateSetting('bodyFont', f)}
                    onWeightChange={(w) => updateSetting('bodyWeight', w)}
                  />
                </div>

                <SliderInput
                  label="Base Font Size"
                  value={settings.fontSize}
                  onChange={(v) => updateSetting('fontSize', v)}
                  min={10}
                  max={18}
                  step={1}
                  unit="px"
                />
              </div>
            </CollapsibleSection>

            {/* Layout */}
            <CollapsibleSection title="Layout">
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm">Header Style</Label>
                  <Select
                    value={settings.headerLayout}
                    onValueChange={(v) => updateSetting('headerLayout', v as 'standard' | 'centered' | 'split')}
                  >
                    <SelectTrigger className="mt-1.5 bg-slate-800/50 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="centered">Centered</SelectItem>
                      <SelectItem value="split">Split (Logo Left, Info Right)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300 text-sm">Table Style</Label>
                  <Select
                    value={settings.tableStyle}
                    onValueChange={(v) => updateSetting('tableStyle', v as 'minimal' | 'bordered' | 'striped')}
                  >
                    <SelectTrigger className="mt-1.5 bg-slate-800/50 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="bordered">Bordered</SelectItem>
                      <SelectItem value="striped">Striped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300 text-sm">Date Format</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(v) => updateSetting('dateFormat', v)}
                  >
                    <SelectTrigger className="mt-1.5 bg-slate-800/50 border-slate-700">
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
              </div>
            </CollapsibleSection>

            {/* Field Visibility */}
            <CollapsibleSection title="Field Visibility">
              <div className="space-y-3">
                {[
                  { key: 'showCompanyAddress', label: 'Company Address' },
                  { key: 'showPaymentTerms', label: 'Payment Terms' },
                  { key: 'showTaxField', label: 'Tax Field' },
                  { key: 'showDiscountField', label: 'Discount Field' },
                  { key: 'showNotesField', label: 'Notes Section' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-slate-300 text-sm">{label}</Label>
                    <Switch
                      checked={settings[key as keyof SleekTemplateSettings] as boolean}
                      onCheckedChange={(v) => updateSetting(key as keyof SleekTemplateSettings, v as any)}
                    />
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Footer */}
            <CollapsibleSection title="Footer">
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm">Footer Message</Label>
                  <Textarea
                    value={settings.footerText || ''}
                    onChange={(e) => updateSetting('footerText', e.target.value || null)}
                    placeholder="Thank you for your business!"
                    className="mt-1.5 bg-slate-800/50 border-slate-700 min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Reset Button */}
            <div className="pt-4 pb-8">
              <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-400 hover:text-white"
                onClick={resetToDefaults}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex-1 h-[calc(100vh-73px)] overflow-auto bg-slate-950 p-8">
          <div className="sticky top-0 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Live Preview</h2>
              <p className="text-sm text-slate-400">See how your invoice will look</p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="bg-slate-900/50 rounded-xl p-6 shadow-2xl">
              <SleekDefaultTemplate settings={settings} scale={0.85} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
