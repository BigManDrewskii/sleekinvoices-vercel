import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Save, Upload, User, Building2, LogOut, Mail, Bell, Link2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { QuickBooksSettings } from "@/components/QuickBooksSettings";
import { OnboardingRestartButton } from "@/components/OnboardingRestartButton";
import { EmailTemplateEditor } from "@/components/EmailTemplateEditor";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";

export default function Settings() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  
  // Profile state
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [taxId, setTaxId] = useState("");
  
  // Logo state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  // Reminder settings state
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderIntervals, setReminderIntervals] = useState<number[]>([3, 7, 14]);
  const [reminderSubject, setReminderSubject] = useState("");
  const [reminderTemplate, setReminderTemplate] = useState("");
  const [reminderCcEmail, setReminderCcEmail] = useState("");
  
  // Fetch reminder settings
  const { data: reminderSettings } = trpc.reminders.getSettings.useQuery();
  const updateReminderSettings = trpc.reminders.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Reminder settings saved successfully");
      utils.reminders.getSettings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save reminder settings");
    },
  });

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCompanyName(user.companyName || "");
      setCompanyAddress(user.companyAddress || "");
      setCompanyPhone(user.companyPhone || "");
      setTaxId((user as any).taxId || "");
      setLogoPreview(user.logoUrl || null);
    }
  }, [user]);
  
  // Populate reminder settings when they load
  useEffect(() => {
    if (reminderSettings) {
      setReminderEnabled(reminderSettings.enabled);
      setReminderIntervals(reminderSettings.intervals);
      setReminderSubject(reminderSettings.emailSubject || "");
      setReminderTemplate(reminderSettings.emailTemplate || "");
      setReminderCcEmail(reminderSettings.ccEmail || "");
    }
  }, [reminderSettings]);

  const utils = trpc.useUtils();
  
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const uploadLogo = trpc.user.uploadLogo.useMutation({
    onSuccess: () => {
      toast.success("Logo uploaded successfully");
      utils.auth.me.invalidate();
      setLogoFile(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload logo");
    },
  });

  const handleReminderIntervalToggle = (day: number) => {
    if (reminderIntervals.includes(day)) {
      setReminderIntervals(reminderIntervals.filter(d => d !== day));
    } else {
      setReminderIntervals([...reminderIntervals, day].sort((a, b) => a - b));
    }
  };
  
  const handleSaveReminderSettings = () => {
    updateReminderSettings.mutate({
      enabled: reminderEnabled,
      intervals: reminderIntervals,
      emailSubject: reminderSubject || undefined,
      emailTemplate: reminderTemplate || undefined,
      ccEmail: reminderCcEmail || null,
    });
  };
  
  const handleSaveProfile = () => {
    updateProfile.mutate({
      name,
      companyName,
      companyAddress,
      companyPhone,
      taxId: taxId || undefined,
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo must be less than 5MB");
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(",")[1];
      uploadLogo.mutate({
        base64Data,
        mimeType: logoFile.type,
      });
    };
    reader.readAsDataURL(logoFile);
  };

  const handleLogout = () => {
    logout();
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

  return (
    <div className="page-wrapper">
      <Navigation />

      {/* Main Content */}
      <div className="page-content page-transition">
        <div className="page-header">
          <h1 className="page-header-title">Settings</h1>
          <p className="page-header-subtitle">Manage your account, company, and integrations</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4 hidden sm:block" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4 hidden sm:block" />
              Company
            </TabsTrigger>
            <TabsTrigger value="reminders" className="gap-2">
              <Bell className="h-4 w-4 hidden sm:block" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Link2 className="h-4 w-4 hidden sm:block" />
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your personal details and account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>Manage your account</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <OnboardingRestartButton />
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeleteAccountDialog />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Details that appear on your invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Inc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Textarea
                    id="companyAddress"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="123 Main St, City, State, ZIP"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Company Phone</Label>
                  <Input
                    id="companyPhone"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">VAT / Tax ID</Label>
                  <Input
                    id="taxId"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g., DE123456789 or EIN: 12-3456789"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your VAT number or Tax ID will appear on invoices
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Company Logo */}
            <Card>
              <CardHeader>
                <CardTitle>Company Logo</CardTitle>
                <CardDescription>Upload your company logo to appear on invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Company Logo"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No logo</p>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="cursor-pointer"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Recommended: Square image, max 5MB
                      </p>
                    </div>

                    {logoFile && (
                      <Button
                        onClick={handleUploadLogo}
                        disabled={uploadLogo.isPending}
                      >
                        {uploadLogo.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Logo
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Reminder Settings</CardTitle>
                <CardDescription>Automatically send payment reminders to clients with overdue invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminderEnabled">Enable Automated Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Send automatic email reminders for overdue invoices
                    </p>
                  </div>
                  <Switch
                    id="reminderEnabled"
                    checked={reminderEnabled}
                    onCheckedChange={setReminderEnabled}
                  />
                </div>
                
                {/* Reminder Intervals */}
                <div className="space-y-3">
                  <Label>Reminder Intervals</Label>
                  <p className="text-sm text-muted-foreground">
                    Send reminders at these intervals after the due date
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {[3, 7, 14, 30].map(day => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`interval-${day}`}
                          checked={reminderIntervals.includes(day)}
                          onCheckedChange={() => handleReminderIntervalToggle(day)}
                          disabled={!reminderEnabled}
                        />
                        <label
                          htmlFor={`interval-${day}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {day} days
                        </label>
                      </div>
                    ))}
                  </div>
                  {reminderIntervals.length === 0 && reminderEnabled && (
                    <p className="text-sm text-destructive">
                      Please select at least one reminder interval
                    </p>
                  )}
                </div>
                
                {/* CC Email */}
                <div className="space-y-2">
                  <Label htmlFor="reminderCcEmail">CC Email Address (Optional)</Label>
                  <Input
                    id="reminderCcEmail"
                    type="email"
                    placeholder="accounting@yourcompany.com"
                    value={reminderCcEmail}
                    onChange={(e) => setReminderCcEmail(e.target.value)}
                    disabled={!reminderEnabled}
                  />
                  <p className="text-sm text-muted-foreground">
                    Receive a copy of all reminder emails sent to clients
                  </p>
                </div>
                
                {/* Email Template - New Visual Editor */}
                <EmailTemplateEditor
                  label="Email Template"
                  value={reminderTemplate}
                  onChange={setReminderTemplate}
                  subject={reminderSubject}
                  onSubjectChange={setReminderSubject}
                  disabled={!reminderEnabled}
                  description="Customize the reminder email sent to clients. Choose a template to get started, then personalize it."
                />
                
                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveReminderSettings}
                    disabled={updateReminderSettings.isPending || (reminderEnabled && reminderIntervals.length === 0)}
                  >
                    {updateReminderSettings.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Reminder Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <QuickBooksSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
