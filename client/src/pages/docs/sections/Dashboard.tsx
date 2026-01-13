import {
  SectionHeading,
  SubsectionHeading,
  P,
  UL,
  LI,
  Strong,
} from "../docComponents";

export const Dashboard = () => (
  <div>
    <SectionHeading>Dashboard Overview</SectionHeading>
    <P>
      Your <Strong>Dashboard</Strong> is the command center of SleekInvoices. It displays:
    </P>

    <SubsectionHeading>Key Metrics</SubsectionHeading>
    <P>
      <Strong>Total Revenue</Strong>: Sum of all paid invoices to date, with trend indicator showing month-over-month change.
    </P>
    <P>
      <Strong>Outstanding Balance</Strong>: Total amount owed across all unpaid and partially paid invoices. This figure helps you understand your cash flow position.
    </P>
    <P>
      <Strong>Total Invoices</Strong>: Cumulative count of all invoices created. Quick stats show how many are overdue, pending, or in draft status.
    </P>
    <P>
      <Strong>Monthly Usage</Strong>: For Free plan users, shows invoices created this month (3 maximum). Pro users see "Unlimited" with a note about their subscription status.
    </P>

    <SubsectionHeading>Quick Actions</SubsectionHeading>
    <P>
      <Strong>New Invoice Button</Strong>: Opens a dialog with three options:
    </P>
    <UL>
      <LI><Strong>Sleeky's Magic Invoice</Strong> (AI-powered, fastest)</LI>
      <LI><Strong>Smart Invoice Builder</Strong> (guided step-by-step)</LI>
      <LI><Strong>Classic Form</Strong> (full control)</LI>
    </UL>
    <P>
      <Strong>View All Invoices</Strong>: Navigate to the complete invoices list with filters and search.
    </P>

    <SubsectionHeading>Recent Invoices</SubsectionHeading>
    <P>
      A table showing your 5 most recent invoices with columns for invoice number, client, date, amount, and status. Click any invoice to view full details.
    </P>

    <SubsectionHeading>Magic Invoice Section</SubsectionHeading>
    <P>
      If you have AI credits remaining, this section displays your credit balance and provides quick access to the AI invoice creator.
    </P>
  </div>
);
