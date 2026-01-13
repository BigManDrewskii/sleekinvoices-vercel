import {
  SectionHeading,
  SubsectionHeading,
  P,
  OL,
  UL,
  LI,
  Strong,
} from "../docComponents";

export const Expenses = () => (
  <div>
    <SectionHeading>Expense Tracking</SectionHeading>

    <SubsectionHeading>Recording Expenses</SubsectionHeading>
    <P>
      Track business expenses for tax deductions and profitability analysis:
    </P>

    <OL>
      <LI>Click <Strong>Expenses</Strong> in the Finances menu</LI>
      <LI>Click <Strong>+ New Expense</Strong></LI>
      <LI>
        Enter:
        <UL>
          <LI><Strong>Description</Strong> (e.g., "Adobe Creative Cloud subscription")</LI>
          <LI><Strong>Category</Strong> (Software, Equipment, Travel, etc.)</LI>
          <LI><Strong>Vendor</Strong> (optional)</LI>
          <LI><Strong>Amount</Strong></LI>
          <LI><Strong>Date</Strong></LI>
          <LI><Strong>Payment Method</Strong> (Credit Card, Cash, Bank Transfer, etc.)</LI>
          <LI><Strong>Tax Amount</Strong> (if applicable)</LI>
          <LI><Strong>Billable</Strong> (checkbox if you want to bill this to a client)</LI>
          <LI><Strong>Receipt</Strong> (upload receipt image for documentation)</LI>
        </UL>
      </LI>
      <LI>Click <Strong>Save Expense</Strong></LI>
    </OL>

    <SubsectionHeading>Billable Expenses</SubsectionHeading>
    <P>
      If an expense is billable (e.g., software purchased for a client project):
    </P>

    <OL>
      <LI>Check the <Strong>Billable</Strong> checkbox when creating the expense</LI>
      <LI>When creating an invoice for that client, click <Strong>Add Billable Expenses</Strong></LI>
      <LI>Select the expenses to include</LI>
      <LI>They auto-populate as line items in the invoice</LI>
      <LI>Send invoice as normal</LI>
    </OL>

    <P>
      This streamlines billing clients for reimbursable expenses.
    </P>

    <SubsectionHeading>Expense Categories</SubsectionHeading>
    <P>
      Create custom expense categories to organize spending:
    </P>

    <OL>
      <LI>Go to <Strong>Expenses</Strong></LI>
      <LI>Click <Strong>Manage Categories</Strong></LI>
      <LI>
        Create categories like:
        <UL>
          <LI>Software & Subscriptions</LI>
          <LI>Equipment & Hardware</LI>
          <LI>Travel & Meals</LI>
          <LI>Marketing & Advertising</LI>
          <LI>Professional Services</LI>
          <LI>Utilities</LI>
        </UL>
      </LI>
      <LI>Assign expenses to categories for better tracking</LI>
    </OL>

    <SubsectionHeading>Expense Reports</SubsectionHeading>
    <P>
      View expense summaries:
    </P>

    <OL>
      <LI>Go to <Strong>Expenses</Strong> page</LI>
      <LI>Filter by date range, category, or payment method</LI>
      <LI>See total expenses and breakdown by category</LI>
      <LI>Export to CSV for accounting</LI>
    </OL>
  </div>
);
