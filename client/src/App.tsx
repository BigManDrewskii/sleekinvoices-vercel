import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { GlobalShortcuts } from "./components/GlobalShortcuts";
import { CommandPalette } from "./components/CommandPalette";
import { GlobalSearch } from "./components/GlobalSearch";
import { ConfettiTrigger } from "./components/Confetti";
import { OnboardingTour } from "./components/OnboardingTour";
import { OnboardingIntro } from "./components/OnboardingIntro";
import { OnboardingMobileModal } from "./components/OnboardingMobileModal";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { AIAssistantProvider } from "./contexts/AIAssistantContext";
import { CookieConsentProvider } from "./contexts/CookieConsentContext";
import { CookieConsentBanner } from "./components/CookieConsentBanner";

// Eager load: Public pages (landing, home, client portal)
// These are needed immediately for anonymous visitors
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Docs from "./pages/Docs";
import ClientPortal from "./pages/ClientPortal";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import RefundPolicy from "./pages/RefundPolicy";

// Lazy load: Authenticated pages
// These are only loaded when user navigates to them after login
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const Invoices = lazy(() => import("./pages/Invoices"));
const CreateInvoice = lazy(() => import("./pages/CreateInvoice"));
const EditInvoice = lazy(() => import("./pages/EditInvoice"));
const ViewInvoice = lazy(() => import("./pages/ViewInvoice"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const Subscription = lazy(() => import("./pages/Subscription"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const SubscriptionHistory = lazy(() => import("./pages/SubscriptionHistory"));
const RecurringInvoices = lazy(() => import("./pages/RecurringInvoices"));
const CreateRecurringInvoice = lazy(() => import("./pages/CreateRecurringInvoice"));
const Templates = lazy(() => import("./pages/Templates"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Payments = lazy(() => import("./pages/Payments"));
const Products = lazy(() => import("./pages/Products"));
const Estimates = lazy(() => import("./pages/Estimates"));
const CreateEstimate = lazy(() => import("./pages/CreateEstimate"));
const ViewEstimate = lazy(() => import("./pages/ViewEstimate"));
const EditEstimate = lazy(() => import("./pages/EditEstimate"));
const GuidedInvoiceCreator = lazy(() => import("./pages/GuidedInvoiceCreator"));
const QuickBooksCallback = lazy(() => import("./pages/QuickBooksCallback"));
const BatchInvoice = lazy(() => import("./pages/BatchInvoice"));
const EmailHistory = lazy(() => import("./pages/EmailHistory"));

import { GearLoader } from "@/components/ui/gear-loader";

// Loading fallback component with elegant gear animation
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 opacity-70">
        <GearLoader size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <>
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          {/* Public routes - eager loaded */}
          <Route path={"/"} component={Home} />
          <Route path={"/landing"} component={Landing} />
          <Route path={"/docs"} component={Docs} />
          <Route path="/portal/:accessToken" component={ClientPortal} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/refund-policy" component={RefundPolicy} />

          {/* Authenticated routes - lazy loaded */}
        <Route path={"/dashboard"} component={Dashboard} />
        <Route path={"/clients"} component={Clients} />
        <Route path={"/invoices"} component={Invoices} />
        <Route path={"/invoices/create"} component={CreateInvoice} />
        <Route path={"/invoices/guided"} component={GuidedInvoiceCreator} />
        <Route path={"/invoices/:id/edit"} component={EditInvoice} />
        <Route path={"/invoices/:id"} component={ViewInvoice} />
        <Route path={"/analytics"} component={Analytics} />
        <Route path={"/settings"} component={Settings} />
        <Route path={"/subscription"} component={Subscription} />
        <Route path={"/subscription/success"} component={SubscriptionSuccess} />
        <Route path={"/subscription/history"} component={SubscriptionHistory} />
        <Route path={"/recurring-invoices"} component={RecurringInvoices} />
        <Route path={"/recurring-invoices/create"} component={CreateRecurringInvoice} />
        <Route path={"/templates"} component={Templates} />
        <Route path={"/expenses"} component={Expenses} />
        <Route path={"/payments"} component={Payments} />
        <Route path={"/products"} component={Products} />
        <Route path={"/estimates"} component={Estimates} />
        <Route path={"/estimates/create"} component={CreateEstimate} />
        <Route path={"/estimates/:id/edit"} component={EditEstimate} />
        <Route path={"/estimates/:id"} component={ViewEstimate} />
        <Route path={"/quickbooks/callback"} component={QuickBooksCallback} />
        <Route path={"/invoices/batch"} component={BatchInvoice} />
        <Route path={"/email-history"} component={EmailHistory} />
        
        {/* 404 - eager loaded */}
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
    </>
  );
}

function App() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <CookieConsentProvider>
          <TooltipProvider>
            <Toaster />
            <KeyboardShortcutsHelp />
            <GlobalShortcuts />
            <GlobalSearch />
            <CommandPalette />
            <ConfettiTrigger />
            <CookieConsentBanner />
            <AIAssistantProvider>
              <OnboardingIntro />
              {isMobile ? <OnboardingMobileModal /> : <OnboardingTour />}
              <Router />
            </AIAssistantProvider>
          </TooltipProvider>
        </CookieConsentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
