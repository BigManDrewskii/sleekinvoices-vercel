import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface Step {
  id: string;
  title: string;
  description?: string;
}

interface MultiStepDialogProps<T extends string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStep: T;
  onStepChange: (step: T) => void;
  steps: Step[];
  children: ReactNode;
  onComplete?: () => void;
  onBack?: () => void;
  showProgress?: boolean;
  maxWidth?: string;
}

/**
 * Multi-step dialog framework
 * Handles step navigation, progress, and layout automatically
 */
export function MultiStepDialog<T extends string>({
  open,
  onOpenChange,
  currentStep,
  onStepChange,
  steps,
  children,
  onComplete,
  onBack,
  showProgress = true,
  maxWidth = "sm:max-w-md",
}: MultiStepDialogProps<T>) {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const currentStepConfig = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
    } else {
      onStepChange(steps[currentStepIndex + 1].id as T);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onBack?.();
      onStepChange(steps[currentStepIndex - 1].id as T);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={maxWidth}>
        <DialogHeader>
          <DialogTitle>{currentStepConfig.title}</DialogTitle>
          {currentStepConfig.description && (
            <DialogDescription>
              {currentStepConfig.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Progress Indicator */}
        {showProgress && steps.length > 1 && (
          <div className="px-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    index <= currentStepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step Content */}
        {children}

        {/* Navigation Footer */}
        <DialogFooter className="gap-3">
          {!isFirstStep && (
            <Button variant="ghost" onClick={handlePrevious}>
              Back
            </Button>
          )}
          <Button onClick={handleNext}>
            {isLastStep ? "Complete" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Import cn function
import { cn } from "@/lib/utils";
