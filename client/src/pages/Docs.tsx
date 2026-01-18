import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LandingNavigation } from "@/components/LandingNavigation";
import {
  Menu,
  X,
  FileText,
  Sparkles,
  CreditCard,
  Users,
  RefreshCw,
  PaintBucket,
  BarChart3,
  ChevronRight,
  BookOpen,
  Settings,
  LayoutDashboard,
  FileCheck,
  Receipt,
  Globe,
  Link as LinkIcon,
  Lightbulb,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { docsContent } from "./docs/docsContent";

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
}

const sections: DocSection[] = [
  // Getting Started Group
  { id: "getting-started", title: "Getting Started", icon: BookOpen },
  { id: "account-setup", title: "Account Setup", icon: Settings },
  { id: "dashboard", title: "Dashboard Overview", icon: LayoutDashboard },

  // Core Features Group
  { id: "managing-clients", title: "Managing Clients", icon: Users },
  { id: "creating-invoices", title: "Creating Invoices", icon: FileText },
  { id: "ai-features", title: "AI-Powered Features", icon: Sparkles },
  { id: "payment-processing", title: "Payment Processing", icon: CreditCard },

  // Advanced Features Group
  { id: "estimates", title: "Estimates & Quotes", icon: FileCheck },
  { id: "analytics", title: "Analytics & Reporting", icon: BarChart3 },
  { id: "expenses", title: "Expense Tracking", icon: Receipt },
  { id: "recurring", title: "Recurring Invoices", icon: RefreshCw },
  { id: "templates", title: "Invoice Templates", icon: PaintBucket },

  // Integration & Portal Group
  { id: "client-portal", title: "Client Portal", icon: Globe },
  { id: "quickbooks", title: "QuickBooks Integration", icon: LinkIcon },
  { id: "subscription", title: "Subscription & Billing", icon: CreditCard },

  // Help & Reference Group
  { id: "best-practices", title: "Best Practices", icon: Lightbulb },
  { id: "troubleshooting", title: "Troubleshooting", icon: AlertCircle },
  { id: "faq", title: "FAQ", icon: HelpCircle },
];

export default function Docs() {
  const [activeSectionId, setActiveSectionId] = useState(sections[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSectionClick = (id: string) => {
    setActiveSectionId(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Landing Navigation - handles both authenticated and unauthenticated users */}
      <LandingNavigation />

      <div className="container mx-auto px-6 py-8 pt-24">
        {/* Mobile: Docs Sidebar Toggle */}
        <div className="lg:hidden mb-4 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="gap-2"
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            {sidebarOpen ? "Close" : "Browse"} Docs
          </Button>
          <span className="text-sm text-muted-foreground">
            {sections.find(s => s.id === activeSectionId)?.title}
          </span>
        </div>

        <div className="flex gap-8 relative">
          {/* Sidebar Navigation */}
          <aside
            className={`
              fixed lg:sticky top-28 left-0 z-40 h-[calc(100vh-8rem)]
              w-64 flex-shrink-0 overflow-y-auto
              bg-background border-r border-border
              transition-transform duration-300 lg:translate-x-0
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <nav className="space-y-1 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Documentation
              </p>
              {sections.map(section => {
                const Icon = section.icon;
                const isActive = section.id === activeSectionId;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
                      transition-colors
                      ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{section.title}</span>
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-4xl">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {docsContent[activeSectionId] || docsContent["getting-started"]}
            </div>

            {/* Navigation between sections */}
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
              <div>
                {sections.findIndex(s => s.id === activeSectionId) > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const currentIndex = sections.findIndex(
                        s => s.id === activeSectionId
                      );
                      handleSectionClick(sections[currentIndex - 1].id);
                    }}
                  >
                    ← Previous
                  </Button>
                )}
              </div>
              <div>
                {sections.findIndex(s => s.id === activeSectionId) <
                  sections.length - 1 && (
                  <Button
                    onClick={() => {
                      const currentIndex = sections.findIndex(
                        s => s.id === activeSectionId
                      );
                      handleSectionClick(sections[currentIndex + 1].id);
                    }}
                  >
                    Next →
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
