import { router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { authRouter } from "./auth.js";
import { userRouter } from "./user.js";
import { clientsRouter } from "./clients.js";
import { productsRouter } from "./products.js";
import { invoicesRouter } from "./invoices.js";
import { analyticsRouter } from "./analytics.js";
import { recurringInvoicesRouter } from "./recurring-invoices.js";
import { templatesRouter } from "./templates.js";
import { customFieldsRouter } from "./custom-fields.js";
import { expensesRouter } from "./expenses.js";
import { currenciesRouter } from "./currencies.js";
import { clientPortalRouter } from "./client-portal.js";
import { paymentsRouter } from "./payments.js";
import { remindersRouter } from "./reminders.js";
import { subscriptionRouter } from "./subscription.js";
import { cryptoRouter } from "./crypto.js";
import { estimatesRouter } from "./estimates.js";
import { aiRouter } from "./ai.js";
import { batchTemplatesRouter } from "./batch-templates.js";
import { quickbooksRouter } from "./quickbooks.js";
import { emailHistoryRouter } from "./email-history.js";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  user: userRouter,
  clients: clientsRouter,
  products: productsRouter,
  invoices: invoicesRouter,
  analytics: analyticsRouter,
  recurringInvoices: recurringInvoicesRouter,
  templates: templatesRouter,
  customFields: customFieldsRouter,
  expenses: expensesRouter,
  currencies: currenciesRouter,
  clientPortal: clientPortalRouter,
  payments: paymentsRouter,
  reminders: remindersRouter,
  subscription: subscriptionRouter,
  crypto: cryptoRouter,
  estimates: estimatesRouter,
  ai: aiRouter,
  batchTemplates: batchTemplatesRouter,
  quickbooks: quickbooksRouter,
  emailHistory: emailHistoryRouter,
});

export type AppRouter = typeof appRouter;
