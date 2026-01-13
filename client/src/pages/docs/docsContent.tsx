import { GettingStarted } from "./sections/GettingStarted";
import { AccountSetup } from "./sections/AccountSetup";
import { Dashboard } from "./sections/Dashboard";
import { ManagingClients } from "./sections/ManagingClients";
import { CreatingInvoices } from "./sections/CreatingInvoices";
import { AIFeatures } from "./sections/AIFeatures";
import { PaymentProcessing } from "./sections/PaymentProcessing";
import { Estimates } from "./sections/Estimates";
import { Analytics } from "./sections/Analytics";
import { Expenses } from "./sections/Expenses";
import { Recurring } from "./sections/Recurring";
import { Templates } from "./sections/Templates";
import { ClientPortal } from "./sections/ClientPortal";
import { QuickBooks } from "./sections/QuickBooks";
import { Subscription } from "./sections/Subscription";
import { BestPractices } from "./sections/BestPractices";
import { Troubleshooting } from "./sections/Troubleshooting";
import { FAQ } from "./sections/FAQ";

export const docsContent: Record<string, React.ReactNode> = {
  "getting-started": <GettingStarted />,
  "account-setup": <AccountSetup />,
  "dashboard": <Dashboard />,
  "managing-clients": <ManagingClients />,
  "creating-invoices": <CreatingInvoices />,
  "ai-features": <AIFeatures />,
  "payment-processing": <PaymentProcessing />,
  "estimates": <Estimates />,
  "analytics": <Analytics />,
  "expenses": <Expenses />,
  "recurring": <Recurring />,
  "templates": <Templates />,
  "client-portal": <ClientPortal />,
  "quickbooks": <QuickBooks />,
  "subscription": <Subscription />,
  "best-practices": <BestPractices />,
  "troubleshooting": <Troubleshooting />,
  "faq": <FAQ />,
};
