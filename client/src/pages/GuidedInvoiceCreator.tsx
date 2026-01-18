import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useReducer, useCallback, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Sparkles,
  User,
  FileText,
  DollarSign,
  Calendar,
  Eye,
  X,
  Building2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types for the guided flow
interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceData {
  clientId: number | null;
  clientName: string;
  lineItems: LineItem[];
  taxRate: number;
  dueDate: string;
  notes: string;
  currency: string;
}

type Step = "client" | "services" | "amounts" | "due-date" | "review";

// Action types for reducer
type Action =
  | { type: "SET_CLIENT"; clientId: number; clientName: string }
  | { type: "ADD_LINE_ITEM"; item: LineItem }
  | { type: "UPDATE_LINE_ITEM"; id: string; item: Partial<LineItem> }
  | { type: "REMOVE_LINE_ITEM"; id: string }
  | { type: "SET_TAX_RATE"; rate: number }
  | { type: "SET_DUE_DATE"; date: string }
  | { type: "SET_NOTES"; notes: string }
  | { type: "SET_CURRENCY"; currency: string }
  | { type: "RESET" };

// Initial state
const initialState: InvoiceData = {
  clientId: null,
  clientName: "",
  lineItems: [{ id: nanoid(), description: "", quantity: 1, rate: 0 }],
  taxRate: 0,
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  notes: "",
  currency: "USD",
};

// Reducer for invoice data
function invoiceReducer(state: InvoiceData, action: Action): InvoiceData {
  switch (action.type) {
    case "SET_CLIENT":
      return {
        ...state,
        clientId: action.clientId,
        clientName: action.clientName,
      };
    case "ADD_LINE_ITEM":
      return { ...state, lineItems: [...state.lineItems, action.item] };
    case "UPDATE_LINE_ITEM":
      return {
        ...state,
        lineItems: state.lineItems.map(item =>
          item.id === action.id ? { ...item, ...action.item } : item
        ),
      };
    case "REMOVE_LINE_ITEM":
      return {
        ...state,
        lineItems: state.lineItems.filter(item => item.id !== action.id),
      };
    case "SET_TAX_RATE":
      return { ...state, taxRate: action.rate };
    case "SET_DUE_DATE":
      return { ...state, dueDate: action.date };
    case "SET_NOTES":
      return { ...state, notes: action.notes };
    case "SET_CURRENCY":
      return { ...state, currency: action.currency };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// Step configuration
const STEPS: {
  id: Step;
  title: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: "client",
    title: "Client",
    icon: <User className="h-5 w-5" />,
    description: "Who is this invoice for?",
  },
  {
    id: "services",
    title: "Services",
    icon: <FileText className="h-5 w-5" />,
    description: "What did you provide?",
  },
  {
    id: "amounts",
    title: "Amounts",
    icon: <DollarSign className="h-5 w-5" />,
    description: "Set quantities and rates",
  },
  {
    id: "due-date",
    title: "Due Date",
    icon: <Calendar className="h-5 w-5" />,
    description: "When is payment due?",
  },
  {
    id: "review",
    title: "Review",
    icon: <Eye className="h-5 w-5" />,
    description: "Review and send",
  },
];

// QuestionStep component with animations
interface QuestionStepProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  direction: "forward" | "backward";
}

function QuestionStep({
  title,
  description,
  icon,
  children,
  isActive,
  direction,
}: QuestionStepProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto transition-all duration-500 ease-out",
        isVisible
          ? "opacity-100 translate-x-0"
          : direction === "forward"
            ? "opacity-0 translate-x-8"
            : "opacity-0 -translate-x-8"
      )}
    >
      {/* Question header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
          {icon}
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>

      {/* Question content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}

// Progress indicator component
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: typeof STEPS;
}

function ProgressIndicator({
  currentStep,
  totalSteps,
  steps,
}: ProgressIndicatorProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      {/* Progress bar */}
      <div className="relative mb-4">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex flex-col items-center transition-all duration-300",
              index <= currentStep ? "opacity-100" : "opacity-40"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                index < currentStep
                  ? "bg-primary text-primary-foreground"
                  : index === currentStep
                    ? "bg-primary/20 text-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span className="text-xs mt-1 hidden sm:block text-muted-foreground">
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main component
export default function GuidedInvoiceCreator() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [state, dispatch] = useReducer(invoiceReducer, initialState);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch clients
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch next invoice number
  const { data: nextNumber } = trpc.invoices.getNextNumber.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: data => {
      toast.success("Invoice created successfully! 🎉");
      utils.invoices.list.invalidate();
      setLocation(`/invoices/${data.id}`);
    },
    onError: error => {
      if (
        error.message?.includes("Monthly invoice limit reached") ||
        error.message?.includes("invoice limit")
      ) {
        setShowUpgradeDialog(true);
      } else {
        toast.error(error.message || "Failed to create invoice");
      }
    },
  });

  const currentStep = STEPS[currentStepIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleNext();
      } else if (e.key === "Escape") {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStepIndex, state]);

  // Focus input on step change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentStepIndex]);

  // Validation for each step
  const canProceed = useCallback(() => {
    switch (currentStep.id) {
      case "client":
        return state.clientId !== null;
      case "services":
        return state.lineItems.some(item => item.description.trim() !== "");
      case "amounts":
        return state.lineItems.some(item => item.rate > 0);
      case "due-date":
        return state.dueDate !== "";
      case "review":
        return true;
      default:
        return false;
    }
  }, [currentStep.id, state]);

  const handleNext = () => {
    if (!canProceed()) {
      toast.error("Please complete this step before continuing");
      return;
    }

    if (currentStepIndex < STEPS.length - 1) {
      setDirection("forward");
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setDirection("backward");
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSubmit = (sendImmediately: boolean) => {
    // Calculate totals
    const subtotal = state.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    const taxAmount = subtotal * (state.taxRate / 100);
    const total = subtotal + taxAmount;

    createInvoice.mutate({
      clientId: state.clientId!,
      invoiceNumber: nextNumber || "INV-0001",
      status: sendImmediately ? "sent" : "draft",
      issueDate: new Date(),
      dueDate: new Date(state.dueDate),
      lineItems: state.lineItems
        .filter(item => item.description.trim() !== "")
        .map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
        })),
      taxRate: state.taxRate,
      discountType: "percentage",
      discountValue: 0,
      notes: state.notes,
      paymentTerms: "Net 30",
      currency: state.currency,
    });
  };

  // Calculate totals for review
  const subtotal = state.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
  const taxAmount = subtotal * (state.taxRate / 100);
  const total = subtotal + taxAmount;

  // Auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="opacity-70">
          <GearLoader size="md" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Sign in to create invoices
            </h2>
            <p className="text-muted-foreground mb-4">
              Create professional invoices in under 60 seconds
            </p>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In to Continue</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container py-8 px-4">
        {/* Header with exit button */}
        <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/invoices")}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Exit
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Guided Creator
          </Badge>
        </div>

        {/* Progress indicator */}
        <ProgressIndicator
          currentStep={currentStepIndex}
          totalSteps={STEPS.length}
          steps={STEPS}
        />

        {/* Step content */}
        <div className="min-h-[400px] flex items-center justify-center">
          {/* Step 1: Client Selection */}
          <QuestionStep
            title="Who is this invoice for?"
            description="Select an existing client or create a new one"
            icon={<User className="h-8 w-8" />}
            isActive={currentStep.id === "client"}
            direction={direction}
          >
            <div className="space-y-4">
              {/* Client search/select */}
              <div className="grid gap-3">
                {clients?.slice(0, 5).map(client => (
                  <button
                    key={client.id}
                    onClick={() =>
                      dispatch({
                        type: "SET_CLIENT",
                        clientId: client.id,
                        clientName: client.name,
                      })
                    }
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                      "hover:border-primary/50 hover:bg-primary/5",
                      state.clientId === client.id
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.email}
                        </p>
                      </div>
                      {state.clientId === client.id && (
                        <Check className="h-5 w-5 text-primary ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Create new client button */}
              <Button
                variant="outline"
                className="w-full h-14 border-dashed"
                onClick={() => setShowClientDialog(true)}
              >
                <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
                Create New Client
              </Button>
            </div>

            <ClientDialog
              open={showClientDialog}
              onOpenChange={setShowClientDialog}
              onSuccess={clientId => {
                setShowClientDialog(false);
                if (clientId) {
                  const newClient = clients?.find(c => c.id === clientId);
                  if (newClient) {
                    dispatch({
                      type: "SET_CLIENT",
                      clientId: newClient.id,
                      clientName: newClient.name,
                    });
                  }
                }
              }}
            />
          </QuestionStep>

          {/* Step 2: Services */}
          <QuestionStep
            title="What services did you provide?"
            description="Add descriptions for each line item"
            icon={<FileText className="h-8 w-8" />}
            isActive={currentStep.id === "services"}
            direction={direction}
          >
            <div className="space-y-3">
              {state.lineItems.map((item, index) => (
                <div key={item.id} className="flex gap-2">
                  <Input
                    ref={index === 0 ? inputRef : undefined}
                    placeholder={`Service or product ${index + 1}...`}
                    value={item.description}
                    onChange={e =>
                      dispatch({
                        type: "UPDATE_LINE_ITEM",
                        id: item.id,
                        item: { description: e.target.value },
                      })
                    }
                    className="flex-1 h-12 text-lg"
                  />
                  {state.lineItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        dispatch({ type: "REMOVE_LINE_ITEM", id: item.id })
                      }
                      className="h-12 w-12 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove line item: ${item.description || "Item"}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full h-12 border-dashed"
                onClick={() =>
                  dispatch({
                    type: "ADD_LINE_ITEM",
                    item: {
                      id: nanoid(),
                      description: "",
                      quantity: 1,
                      rate: 0,
                    },
                  })
                }
              >
                <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
                Add Another Item
              </Button>
            </div>
          </QuestionStep>

          {/* Step 3: Amounts */}
          <QuestionStep
            title="Set quantities and rates"
            description="Enter the quantity and rate for each item"
            icon={<DollarSign className="h-8 w-8" />}
            isActive={currentStep.id === "amounts"}
            direction={direction}
          >
            <div className="space-y-4">
              {state.lineItems
                .filter(item => item.description.trim() !== "")
                .map(item => (
                  <Card key={item.id} className="p-4">
                    <p className="font-medium mb-3 truncate">
                      {item.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor={`quantity-${item.id}`}
                          className="text-sm text-muted-foreground mb-1 block"
                        >
                          Quantity
                        </label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e =>
                            dispatch({
                              type: "UPDATE_LINE_ITEM",
                              id: item.id,
                              item: {
                                quantity: parseFloat(e.target.value) || 1,
                              },
                            })
                          }
                          className="h-12 text-lg"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`rate-${item.id}`}
                          className="text-sm text-muted-foreground mb-1 block"
                        >
                          Rate ($)
                        </label>
                        <Input
                          id={`rate-${item.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate || ""}
                          onChange={e =>
                            dispatch({
                              type: "UPDATE_LINE_ITEM",
                              id: item.id,
                              item: { rate: parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="h-12 text-lg"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <p className="text-right mt-2 text-muted-foreground">
                      Subtotal:{" "}
                      <span className="font-medium text-foreground">
                        ${(item.quantity * item.rate).toFixed(2)}
                      </span>
                    </p>
                  </Card>
                ))}

              {/* Tax rate */}
              <div className="pt-4 border-t">
                <label
                  htmlFor="tax-rate"
                  className="text-sm text-muted-foreground mb-2 block"
                >
                  Tax Rate (%)
                </label>
                <Input
                  id="tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  value={state.taxRate || ""}
                  onChange={e =>
                    dispatch({
                      type: "SET_TAX_RATE",
                      rate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-12 text-lg max-w-[150px]"
                  placeholder="0"
                />
              </div>
            </div>
          </QuestionStep>

          {/* Step 4: Due Date */}
          <QuestionStep
            title="When is payment due?"
            description="Set the due date for this invoice"
            icon={<Calendar className="h-8 w-8" />}
            isActive={currentStep.id === "due-date"}
            direction={direction}
          >
            <div className="space-y-6">
              {/* Quick select buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Due on receipt", days: 0 },
                  { label: "Net 15", days: 15 },
                  { label: "Net 30", days: 30 },
                  { label: "Net 60", days: 60 },
                ].map(option => {
                  const date = new Date(
                    Date.now() + option.days * 24 * 60 * 60 * 1000
                  )
                    .toISOString()
                    .split("T")[0];
                  return (
                    <button
                      key={option.label}
                      onClick={() => dispatch({ type: "SET_DUE_DATE", date })}
                      className={cn(
                        "p-3 rounded-xl border-2 text-center transition-all duration-200",
                        "hover:border-primary/50 hover:bg-primary/5",
                        state.dueDate === date
                          ? "border-primary bg-primary/10"
                          : "border-border"
                      )}
                    >
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(date).toLocaleDateString()}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Custom date */}
              <div>
                <label
                  htmlFor="custom-date"
                  className="text-sm text-muted-foreground mb-2 block"
                >
                  Or select a custom date
                </label>
                <Input
                  id="custom-date"
                  type="date"
                  value={state.dueDate}
                  onChange={e =>
                    dispatch({ type: "SET_DUE_DATE", date: e.target.value })
                  }
                  className="h-12 text-lg max-w-[200px]"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="text-sm text-muted-foreground mb-2 block"
                >
                  Additional notes (optional)
                </label>
                <Textarea
                  id="notes"
                  placeholder="Payment instructions, thank you message, etc."
                  value={state.notes}
                  onChange={e =>
                    dispatch({ type: "SET_NOTES", notes: e.target.value })
                  }
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </QuestionStep>

          {/* Step 5: Review */}
          <QuestionStep
            title="Review your invoice"
            description="Make sure everything looks correct"
            icon={<Eye className="h-8 w-8" />}
            isActive={currentStep.id === "review"}
            direction={direction}
          >
            <Card className="overflow-hidden">
              <div className="bg-primary/10 p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice for</p>
                    <p className="text-xl font-semibold">{state.clientName}</p>
                  </div>
                  <Badge variant="secondary">{nextNumber || "INV-0001"}</Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-4">
                {/* Line items */}
                <div className="space-y-2">
                  {state.lineItems
                    .filter(item => item.description.trim() !== "")
                    .map(item => (
                      <div
                        key={item.id}
                        className="flex justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × ${item.rate.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-medium">
                          ${(item.quantity * item.rate).toFixed(2)}
                        </p>
                      </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {state.taxRate > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax ({state.taxRate}%)</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Due date */}
                <div className="flex justify-between pt-4 border-t text-sm">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{new Date(state.dueDate).toLocaleDateString()}</span>
                </div>

                {/* Notes */}
                {state.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{state.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => handleSubmit(false)}
                disabled={createInvoice.isPending}
              >
                <FileText className="h-5 w-5 mr-2" />
                Save as Draft
              </Button>
              <Button
                className="flex-1 h-12"
                onClick={() => handleSubmit(true)}
                disabled={createInvoice.isPending}
              >
                <Send className="h-5 w-5 mr-2" />
                {createInvoice.isPending ? "Creating..." : "Send Invoice"}
              </Button>
            </div>
          </QuestionStep>
        </div>

        {/* Navigation buttons */}
        {currentStep.id !== "review" && (
          <div className="flex justify-between max-w-2xl mx-auto mt-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Keyboard hint */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
            Enter
          </kbd>{" "}
          to continue,{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
            Esc
          </kbd>{" "}
          to go back
        </p>
      </main>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        reason="invoice_limit"
      />
    </div>
  );
}
