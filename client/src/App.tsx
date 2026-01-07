import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { GlobalShortcuts } from "./components/GlobalShortcuts";
import { CommandPalette } from "./components/CommandPalette";
import { ConfettiTrigger } from "./components/Confetti";
import { AIAssistantProvider } from "./contexts/AIAssistantContext";

// Eager load: Public pages (landing, home, client portal)
// These are needed immediately for anonymous visitors
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import ClientPortal from "./pages/ClientPortal";
import NotFound from "./pages/NotFound";

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

import { GearLoader } from "@/components/ui/gear-loader";

// Loading fallback component with elegant gear animation
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <GearLoader size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Public routes - eager loaded */}
        <Route path={"/"} component={Home} />
        <Route path={"/landing"} component={Landing} />
        <Route path="/portal/:accessToken" component={ClientPortal} />
        
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
        
        {/* 404 - eager loaded */}
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <KeyboardShortcutsHelp />
          <GlobalShortcuts />
          <CommandPalette />
          <ConfettiTrigger />
          <AIAssistantProvider>
            <Router />
          </AIAssistantProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
