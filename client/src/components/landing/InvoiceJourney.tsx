import { useState, useEffect } from "react";
import { Sparkles, Send, CheckCircle2, Zap, Mail, Bell } from "lucide-react";

const journeySteps = [
  {
    step: 1,
    title: "Describe your work",
    description: "Tell Sleeky what you did in plain English. No forms, no templates.",
    example: '"Built landing page for Acme Corp, 40 hours at $150/hr"',
    icon: Sparkles,
    color: "from-violet-500 to-purple-600",
  },
  {
    step: 2,
    title: "AI creates your invoice",
    description: "Sleeky extracts client, items, rates, and generates a professional invoice instantly.",
    detail: "Auto-matches existing clients • Applies your branding • Calculates totals",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
  },
  {
    step: 3,
    title: "One-click send",
    description: "Review and send directly to your client's inbox. PDF attached automatically.",
    detail: "Personalized email • Professional PDF • Tracking enabled",
    icon: Send,
    color: "from-emerald-500 to-green-500",
  },
  {
    step: 4,
    title: "Get paid, stay notified",
    description: "Automatic payment reminders. Real-time notifications when you get paid.",
    detail: "Smart reminders • Payment tracking • Revenue analytics",
    icon: CheckCircle2,
    color: "from-amber-500 to-orange-500",
  },
];

export function InvoiceJourney() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % journeySteps.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const currentStep = journeySteps[activeStep];
  const Icon = currentStep.icon;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Card */}
      <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
        {/* Animated gradient background */}
        <div 
          className={`absolute inset-0 opacity-5 bg-gradient-to-br ${currentStep.color} transition-all duration-1000`}
        />
        
        {/* Content */}
        <div className="relative p-8 md:p-10">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {journeySteps.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  i === activeStep 
                    ? "border-primary bg-primary text-primary-foreground scale-110" 
                    : i < activeStep
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span className="text-sm font-bold">{step.step}</span>
              </button>
            ))}
            <div className="flex-1 h-0.5 bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(activeStep / (journeySteps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Active Step Content */}
          <div 
            key={activeStep}
            className="fade-in-up space-y-6"
          >
            {/* Icon and Title */}
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${currentStep.color} shadow-lg`}>
                <Icon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {currentStep.title}
                </h3>
                <p className="text-lg text-muted-foreground">
                  {currentStep.description}
                </p>
              </div>
            </div>

            {/* Example or Detail */}
            {currentStep.example && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Example input:</p>
                <p className="text-foreground font-mono text-sm">
                  {currentStep.example}
                </p>
              </div>
            )}

            {currentStep.detail && (
              <div className="flex flex-wrap gap-2">
                {currentStep.detail.split(" • ").map((item, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom progress bar */}
        <div className="h-1 bg-muted">
          <div 
            className={`h-full bg-gradient-to-r ${currentStep.color} transition-all duration-300`}
            style={{ 
              width: isPaused ? "100%" : "0%",
              animation: isPaused ? "none" : "progress 4s linear infinite"
            }}
          />
        </div>
      </div>

      {/* Caption */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        Hover to pause • Click steps to navigate
      </p>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
