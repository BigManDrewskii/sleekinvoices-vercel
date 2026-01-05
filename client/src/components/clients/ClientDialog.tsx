import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, X, Loader2, Shield } from "lucide-react";

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  vatNumber?: string | null;
  taxExempt?: boolean;
}

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSuccess?: (clientId?: number) => void;
}

type VATValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

export function ClientDialog({ open, onOpenChange, client, onSuccess }: ClientDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [taxExempt, setTaxExempt] = useState(false);
  const [vatValidationStatus, setVatValidationStatus] = useState<VATValidationStatus>('idle');
  const [vatValidationMessage, setVatValidationMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();
  
  const validateVAT = trpc.clients.validateVAT.useMutation({
    onSuccess: (result) => {
      if (result.valid) {
        setVatValidationStatus('valid');
        setVatValidationMessage(`Valid VAT number${result.name ? ` - ${result.name}` : ''}`);
        
        // Auto-fill company name if returned and name field is empty
        if (result.name && !name.trim()) {
          setName(result.name);
          toast.success("Company name auto-filled from VAT registry");
        }
        
        // Auto-fill address if returned and address field is empty
        if (result.address && !address.trim()) {
          setAddress(result.address);
        }
      } else {
        setVatValidationStatus('invalid');
        setVatValidationMessage(result.errorMessage || 'Invalid VAT number');
      }
    },
    onError: (error) => {
      setVatValidationStatus('invalid');
      setVatValidationMessage(error.message || 'Validation failed');
    },
  });
  
  const createClient = trpc.clients.create.useMutation({
    onSuccess: (data) => {
      toast.success("Client created successfully");
      utils.clients.list.invalidate();
      onOpenChange(false);
      resetForm();
      onSuccess?.(data.id);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create client");
    },
  });

  const updateClient = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Client updated successfully");
      utils.clients.list.invalidate();
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update client");
    },
  });

  useEffect(() => {
    if (client) {
      setName(client.name);
      setEmail(client.email || "");
      setPhone(client.phone || "");
      setAddress(client.address || "");
      setVatNumber(client.vatNumber || "");
      setTaxExempt(client.taxExempt || false);
      // Reset VAT validation status when editing
      setVatValidationStatus('idle');
      setVatValidationMessage("");
    } else {
      resetForm();
    }
  }, [client, open]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setVatNumber("");
    setTaxExempt(false);
    setVatValidationStatus('idle');
    setVatValidationMessage("");
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleValidateVAT = () => {
    if (!vatNumber.trim()) {
      toast.error("Please enter a VAT number to validate");
      return;
    }
    
    setVatValidationStatus('validating');
    setVatValidationMessage("");
    validateVAT.mutate({ vatNumber: vatNumber.trim() });
  };

  const handleVatNumberChange = (value: string) => {
    setVatNumber(value);
    // Reset validation status when VAT number changes
    if (vatValidationStatus !== 'idle') {
      setVatValidationStatus('idle');
      setVatValidationMessage("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const data = {
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      vatNumber: vatNumber.trim() || undefined,
      taxExempt,
    };

    if (client) {
      updateClient.mutate({ id: client.id, ...data });
    } else {
      createClient.mutate(data);
    }
  };

  const isLoading = createClient.isPending || updateClient.isPending;

  const getVatStatusIcon = () => {
    switch (vatValidationStatus) {
      case 'validating':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'valid':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
            <DialogDescription>
              {client ? "Update client information" : "Add a new client to your database"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe or Company Name"
                disabled={isLoading}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State, ZIP"
                rows={3}
                disabled={isLoading}
              />
            </div>
            
            {/* VAT / Tax ID Section */}
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Tax Information</span>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="vatNumber">VAT / Tax ID</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="vatNumber"
                      value={vatNumber}
                      onChange={(e) => handleVatNumberChange(e.target.value.toUpperCase())}
                      placeholder="e.g., DE123456789"
                      disabled={isLoading}
                      className="pr-8"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {getVatStatusIcon()}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleValidateVAT}
                    disabled={isLoading || validateVAT.isPending || !vatNumber.trim()}
                    className="whitespace-nowrap"
                  >
                    {validateVAT.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Validating
                      </>
                    ) : (
                      "Validate VAT"
                    )}
                  </Button>
                </div>
                {vatValidationMessage && (
                  <p className={`text-sm ${vatValidationStatus === 'valid' ? 'text-green-600' : 'text-red-500'}`}>
                    {vatValidationMessage}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  For EU clients, enter the full VAT number including country code (e.g., DE123456789)
                </p>
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="taxExempt"
                  checked={taxExempt}
                  onCheckedChange={(checked) => setTaxExempt(checked === true)}
                  disabled={isLoading}
                />
                <Label 
                  htmlFor="taxExempt" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Tax Exempt
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                Check this if the client is exempt from tax (e.g., reverse charge for B2B EU transactions)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : client ? "Update Client" : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
