import {
  SectionHeading,
  SubsectionHeading,
  P,
  OL,
  UL,
  LI,
  Strong,
} from "../docComponents";

export const Analytics = () => (
  <div>
    <SectionHeading>Analytics & Reporting</SectionHeading>

    <SubsectionHeading>Dashboard Analytics</SubsectionHeading>
    <P>
      The <Strong>Analytics</Strong> page provides comprehensive business insights:
    </P>

    <P>
      <Strong>Financial Summary</Strong>:
    </P>
    <UL>
      <LI>Total Revenue (all-time)</LI>
      <LI>Outstanding Balance (unpaid invoices)</LI>
      <LI>Collection Rate (percentage of invoices paid on time)</LI>
      <LI>Days Sales Outstanding (average days to collect payment)</LI>
    </UL>

    <P>
      <Strong>Revenue Trend</Strong>: Interactive line chart showing monthly revenue over the past 12 months. Hover to see exact amounts.
    </P>

    <P>
      <Strong>Invoice Status</Strong>: Pie chart showing breakdown of invoices by status (Draft, Sent, Paid, Overdue, Canceled).
    </P>

    <P>
      <Strong>Receivables Aging</Strong>: Shows how long invoices have been outstanding:
    </P>
    <UL>
      <LI>Current (not yet due)</LI>
      <LI>0-30 days overdue</LI>
      <LI>31-60 days overdue</LI>
      <LI>61-90 days overdue</LI>
      <LI>90+ days overdue</LI>
    </UL>

    <P>
      <Strong>Top Clients</Strong>: List of your most profitable clients by revenue.
    </P>

    <P>
      <Strong>Email Performance</Strong>: Open and click rates for invoice emails and payment reminders.
    </P>

    <SubsectionHeading>Exporting Reports</SubsectionHeading>
    <P>
      Export your data for accounting or analysis:
    </P>

    <OL>
      <LI>Go to <Strong>Invoices</Strong> or <Strong>Expenses</Strong></LI>
      <LI>Click <Strong>Export</Strong> button</LI>
      <LI>
        Choose format:
        <UL>
          <LI><Strong>CSV</Strong> (for Excel/spreadsheets)</LI>
          <LI><Strong>PDF</Strong> (for printing/sharing)</LI>
        </UL>
      </LI>
      <LI>Select date range and filters</LI>
      <LI>Download file</LI>
    </OL>
  </div>
);
