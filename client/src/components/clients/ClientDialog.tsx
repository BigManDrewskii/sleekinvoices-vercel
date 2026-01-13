import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogIconHeader, DialogBody, DialogActions } from "@/components/shared/DialogPatterns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Loader2, Shield, UserPlus, User, Mail, Phone, MapPin, Building2, FileText, Check as LucideCheck } from "lucide-react";
import { Check } from "@phosphor-icons/react";

/**
 * ClientDialog handles both client creation and updates in a single component.
 * TODO: Consider splitting into ClientCreateDialog and ClientUpdateDialog
 * for better separation of concerns and easier testing. Estimated effort: 4 hours.
 */

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  vatNumber?: string | null;
  taxExempt?: boolean | null;
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
    // Optimistic update: immediately add to UI
    onMutate: async (newClient) => {
      // Cancel any outgoing refetches
      await utils.clients.list.cancel();
      
      // Snapshot the previous value
      const previousClients = utils.clients.list.getData();
      
      // Optimistically add the new client with a temporary ID
      const optimisticClient = {
        id: -Date.now(), // Temporary negative ID
        name: newClient.name,
        email: newClient.email || null,
        phone: newClient.phone || null,
        address: newClient.address || null,
        companyName: null,
        notes: null,
        vatNumber: newClient.vatNumber || null,
        taxExempt: newClient.taxExempt ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 0, // Temporary userId, will be replaced on server response
      };
      
      utils.clients.list.setData(undefined, (old) => 
        old ? [optimisticClient, ...old] : [optimisticClient]
      );
      
      // Close dialog immediately for instant feedback
      onOpenChange(false);
      resetForm();
      
      return { previousClients };
    },
    onSuccess: (data) => {
      toast.success("Client created successfully");
      onSuccess?.(data.id);
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousClients) {
        utils.clients.list.setData(undefined, context.previousClients);
      }
      toast.error(error.message || "Failed to create client");
    },
    onSettled: () => {
      // Always refetch to sync with server
      utils.clients.list.invalidate();
    },
  });

  const updateClient = trpc.clients.update.useMutation({
    // Optimistic update: immediately update in UI
    onMutate: async (updatedClient) => {
      await utils.clients.list.cancel();
      
      const previousClients = utils.clients.list.getData();
      
      // Optimistically update the client in the list
      utils.clients.list.setData(undefined, (old) => 
        old?.map((c) => 
          c.id === updatedClient.id 
            ? { 
                ...c, 
                name: updatedClient.name || c.name,
                email: updatedClient.email || null,
                phone: updatedClient.phone || null,
                address: updatedClient.address || null,
                vatNumber: updatedClient.vatNumber || null,
                taxExempt: updatedClient.taxExempt ?? c.taxExempt,
                updatedAt: new Date(),
              } 
            : c
        )
      );
      
      onOpenChange(false);
      resetForm();
      
      return { previousClients };
    },
    onSuccess: () => {
      toast.success("Client updated successfully");
      onSuccess?.();
    },
    onError: (error, _variables, context) => {
      if (context?.previousClients) {
        utils.clients.list.setData(undefined, context.previousClients);
      }
      toast.error(error.message || "Failed to update client");
    },
    onSettled: () => {
      utils.clients.list.invalidate();
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
        return <LucideCheck className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              <DialogIconHeader
                icon={UserPlus}
                title={client ? "Edit Client" : "Add New Client"}
                variant="primary"
                size="sm"
              />
            </DialogTitle>
            <DialogDescription>
              {client ? "Update client information" : "Add a new client to your database"}
            </DialogDescription>
          </DialogHeader>

          <DialogBody spacing="relaxed">
            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">Contact Information</h3>
              </div>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe or Company Name"
                      disabled={isLoading}
                      className="pl-9"
                    />
                  </div>
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        disabled={isLoading}
                        className="pl-9"
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        disabled={isLoading}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main St, City, State, ZIP"
                      rows={2}
                      disabled={isLoading}
                      className="pl-9 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="h-px bg-border" />
            
            {/* Tax Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Tax Information</span>
              </div>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vatNumber" className="text-sm font-medium">VAT / Tax ID</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="vatNumber"
                        value={vatNumber}
                        onChange={(e) => handleVatNumberChange(e.target.value.toUpperCase())}
                        placeholder="e.g., DE123456789"
                        disabled={isLoading}
                        className="pl-9 pr-8"
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
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Validating
                        </>
                      ) : (
                        "Validate VAT"
                      )}
                    </Button>
                  </div>
                  {vatValidationMessage && (
                    <p className={`text-sm ${vatValidationStatus === 'valid' ? 'text-green-600' : 'text-destructive'}`}>
                      {vatValidationMessage}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    For EU clients, enter the full VAT number including country code
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
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
                <p className="text-xs text-muted-foreground -mt-2 ml-6">
                  Check this if the client is exempt from tax (e.g., reverse charge for B2B EU transactions)
                </p>
              </div>
            </div>
          </DialogBody>

          <DialogActions
            onClose={() => onOpenChange(false)}
            onSubmit={() => {}} // Form handles submit via form onSubmit
            submitText={client ? "Update Client" : "Create Client"}
            cancelText="Cancel"
            isLoading={isLoading}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
