import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import EditInvoice from "./pages/EditInvoice";
import ViewInvoice from "./pages/ViewInvoice";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import RecurringInvoices from "./pages/RecurringInvoices";
import CreateRecurringInvoice from "./pages/CreateRecurringInvoice";
import Templates from "./pages/Templates";
import Expenses from "./pages/Expenses";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/clients"} component={Clients} />
      <Route path={"/invoices"} component={Invoices} />
      <Route path={"/invoices/create"} component={CreateInvoice} />
      <Route path={"/invoices/:id/edit"} component={EditInvoice} />
      <Route path={"/invoices/:id"} component={ViewInvoice} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/subscription"} component={Subscription} />
      <Route path={"/recurring-invoices"} component={RecurringInvoices} />
      <Route path={"/recurring-invoices/create"} component={CreateRecurringInvoice} />
      <Route path={"/templates"} component={Templates} />
      <Route path={"/expenses"} component={Expenses} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
