import { useState, useEffect } from "react";
import { FileText, Sparkles, Send, CheckCircle2 } from "lucide-react";

const stages = [
  {
    icon: FileText,
    title: "Start with a blank invoice",
    description: "Quick and easy setup",
    color: "text-muted-foreground",
  },
  {
    icon: Sparkles,
    title: "AI fills in the details",
    description: "Smart suggestions and auto-complete",
    color: "text-primary",
  },
  {
    icon: Send,
    title: "Review and send",
    description: "One-click delivery to your client",
    color: "text-blue-500",
  },
  {
    icon: CheckCircle2,
    title: "Track payment",
    description: "Get notified when paid",
    color: "text-green-500",
  },
];

export function AnimatedProductDemo() {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % stages.length);
    }, 2500); // 2.5s per stage

    return () => clearInterval(interval);
  }, []);

  const stage = stages[currentStage];
  const Icon = stage.icon;

  return (
    <div className="relative">
      {/* Main Demo Card */}
      <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 md:p-12 overflow-hidden">
        {/* Background gradient that changes with stage */}
        <div
          className="absolute inset-0 opacity-10 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at ${25 * currentStage}% 50%, var(--primary) 0%, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          {/* Animated Icon */}
          <div className="relative">
            <div
              className={`h-20 w-20 rounded-2xl bg-background border border-border flex items-center justify-center transition-all duration-500 ${
                currentStage === 1 ? "scale-110 rotate-3" : ""
              } ${currentStage === 3 ? "scale-110 -rotate-3" : ""}`}
            >
              <Icon
                className={`h-10 w-10 ${stage.color} transition-colors duration-500`}
              />
            </div>

            {/* Success confetti effect for final stage */}
            {currentStage === 3 && (
              <div className="absolute -inset-4 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-2 w-2 rounded-full bg-green-500 animate-ping"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: "1s",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Text Content with fade transition */}
          <div
            key={currentStage}
            className="fade-in-up space-y-2 max-w-md"
          >
            <h3 className="text-2xl font-bold text-foreground">
              {stage.title}
            </h3>
            <p className="text-muted-foreground">{stage.description}</p>
          </div>

          {/* Stage Indicators */}
          <div className="flex items-center gap-2 pt-4">
            {stages.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === currentStage
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 text-muted-foreground/5 pointer-events-none">
          <FileText className="h-32 w-32" />
        </div>
      </div>

      {/* Small caption */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        From start to finish in under a minute
      </p>
    </div>
  );
}
