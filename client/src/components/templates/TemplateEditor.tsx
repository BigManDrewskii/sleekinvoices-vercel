import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TEMPLATE_PRESETS } from "@shared/template-presets";
import { TemplatePreview } from "./TemplatePreview";

interface TemplateEditorProps {
  templateId?: number | null;
  onComplete: () => void;
  onCancel: () => void;
}

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
  const [secondaryColor, setSecondaryColor] = useState("#252f33");
  const [accentColor, setAccentColor] = useState("#10b981");
  const [headingFont, setHeadingFont] = useState("Inter");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [fontSize, setFontSize] = useState(14);
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const { data: user } = trpc.auth.me.useQuery();

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
        setLogoFile(null);
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
      primaryColor,
      secondaryColor,
      accentColor,
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
    primaryColor,
    secondaryColor,
    accentColor,
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
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isNew ? "Create Template" : "Edit Template"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Customize your invoice appearance
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Editor Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Name and template style</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., My Custom Template"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateType">Template Style</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger id="templateType">
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

                <div className="flex items-center justify-between">
                  <Label htmlFor="isDefault">Set as default template</Label>
                  <Switch
                    id="isDefault"
                    checked={isDefault}
                    onCheckedChange={setIsDefault}
                  />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="fields">Fields</TabsTrigger>
              </TabsList>

              <TabsContent value="colors">
                <Card>
                  <CardHeader>
                    <CardTitle>Color Scheme</CardTitle>
                    <CardDescription>Customize your brand colors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            placeholder="#5f6fff"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            placeholder="#252f33"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accentColor">Accent Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="accentColor"
                            type="color"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            placeholder="#10b981"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="typography">
                <Card>
                  <CardHeader>
                    <CardTitle>Typography</CardTitle>
                    <CardDescription>Font family and size settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="headingFont">Heading Font</Label>
                      <Select value={headingFont} onValueChange={setHeadingFont}>
                        <SelectTrigger id="headingFont">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Arial Black">Arial Black</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bodyFont">Body Font</Label>
                      <Select value={bodyFont} onValueChange={setBodyFont}>
                        <SelectTrigger id="bodyFont">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fontSize">Font Size (px)</Label>
                      <Input
                        id="fontSize"
                        type="number"
                        min="10"
                        max="20"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value) || 14)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="layout">
                <Card>
                  <CardHeader>
                    <CardTitle>Layout Options</CardTitle>
                    <CardDescription>Header, footer, and logo positioning</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="headerLayout">Header Layout</Label>
                      <Select value={headerLayout} onValueChange={setHeaderLayout}>
                        <SelectTrigger id="headerLayout">
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
                      <Label htmlFor="footerLayout">Footer Layout</Label>
                      <Select value={footerLayout} onValueChange={setFooterLayout}>
                        <SelectTrigger id="footerLayout">
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
                      <Label htmlFor="logoPosition">Logo Position</Label>
                      <Select value={logoPosition} onValueChange={setLogoPosition}>
                        <SelectTrigger id="logoPosition">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logoUpload">Company Logo</Label>
                      <div className="space-y-3">
                        <input
                          id="logoUpload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleLogoFileChange(file);
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('logoUpload')?.click()}
                          disabled={isUploadingLogo}
                          className="w-full"
                        >
                          {isUploadingLogo ? 'Uploading...' : logoFile ? logoFile.name : 'Choose Logo File'}
                        </Button>
                        {logoUrl && (
                          <div className="flex items-center gap-2">
                            <img src={logoUrl} alt="Logo preview" className="h-10 object-contain" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setLogoUrl(null)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logoWidth">Logo Width (px)</Label>
                      <Input
                        id="logoWidth"
                        type="number"
                        min="80"
                        max="300"
                        value={logoWidth}
                        onChange={(e) => setLogoWidth(parseInt(e.target.value) || 150)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="footerText">Footer Text</Label>
                      <Textarea
                        id="footerText"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        placeholder="Thank you for your business!"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fields">
                <Card>
                  <CardHeader>
                    <CardTitle>Field Visibility</CardTitle>
                    <CardDescription>Show or hide invoice fields</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showCompanyAddress">Company Address</Label>
                      <Switch
                        id="showCompanyAddress"
                        checked={showCompanyAddress}
                        onCheckedChange={setShowCompanyAddress}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="showPaymentTerms">Payment Terms</Label>
                      <Switch
                        id="showPaymentTerms"
                        checked={showPaymentTerms}
                        onCheckedChange={setShowPaymentTerms}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="showTaxField">Tax Field</Label>
                      <Switch
                        id="showTaxField"
                        checked={showTaxField}
                        onCheckedChange={setShowTaxField}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="showDiscountField">Discount Field</Label>
                      <Switch
                        id="showDiscountField"
                        checked={showDiscountField}
                        onCheckedChange={setShowDiscountField}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="showNotesField">Notes Field</Label>
                      <Switch
                        id="showNotesField"
                        checked={showNotesField}
                        onCheckedChange={setShowNotesField}
                      />
                    </div>

                    <div className="pt-4 space-y-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <Select value={dateFormat} onValueChange={setDateFormat}>
                          <SelectTrigger id="dateFormat">
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>See how your invoice will look</CardDescription>
              </CardHeader>
              <CardContent className="overflow-auto max-h-[calc(100vh-16rem)]">
                <TemplatePreview template={currentTemplate} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
