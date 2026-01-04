import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

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
const RecurringInvoices = lazy(() => import("./pages/RecurringInvoices"));
const CreateRecurringInvoice = lazy(() => import("./pages/CreateRecurringInvoice"));
const Templates = lazy(() => import("./pages/Templates"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Payments = lazy(() => import("./pages/Payments"));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
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
        <Route path={"/invoices/:id/edit"} component={EditInvoice} />
        <Route path={"/invoices/:id"} component={ViewInvoice} />
        <Route path={"/analytics"} component={Analytics} />
        <Route path={"/settings"} component={Settings} />
        <Route path={"/subscription"} component={Subscription} />
        <Route path={"/subscription/success"} component={SubscriptionSuccess} />
        <Route path={"/recurring-invoices"} component={RecurringInvoices} />
        <Route path={"/recurring-invoices/create"} component={CreateRecurringInvoice} />
        <Route path={"/templates"} component={Templates} />
        <Route path={"/expenses"} component={Expenses} />
        <Route path={"/payments"} component={Payments} />
        
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
