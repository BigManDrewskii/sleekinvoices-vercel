import {
  SectionHeading,
  SubsectionHeading,
  P,
  OL,
  UL,
  LI,
  Strong,
} from "../docComponents";

export const Recurring = () => (
  <div>
    <SectionHeading>Recurring Invoices</SectionHeading>

    <SubsectionHeading>Setting Up Recurring Invoices</SubsectionHeading>
    <P>
      For clients with regular payments (retainers, subscriptions, monthly services):
    </P>

    <OL>
      <LI>Click <Strong>Recurring Invoices</Strong> in the Finances menu</LI>
      <LI>Click <Strong>+ New Recurring Invoice</Strong></LI>
      <LI>
        Configure:
        <UL>
          <LI><Strong>Client</Strong> (required)</LI>
          <LI><Strong>Line Items</Strong> (same as regular invoices)</LI>
          <LI><Strong>Frequency</Strong> (Monthly, Quarterly, Semi-Annual, Annual)</LI>
          <LI><Strong>Start Date</Strong> (when first invoice is created)</LI>
          <LI><Strong>End Date</Strong> (optional, leave blank for ongoing)</LI>
          <LI><Strong>Auto-Send</Strong> (enable to send automatically)</LI>
        </UL>
      </LI>
      <LI>Click <Strong>Create Recurring Invoice</Strong></LI>
    </OL>

    <SubsectionHeading>How Recurring Invoices Work</SubsectionHeading>

    <OL>
      <LI>On the start date, an invoice is automatically created</LI>
      <LI>If auto-send is enabled, it's emailed to the client</LI>
      <LI>The next invoice is created on the next scheduled date</LI>
      <LI>This continues until the end date (or indefinitely if no end date)</LI>
    </OL>

    <P>
      <Strong>Example</Strong>: A $2,000/month retainer starting January 1st with monthly frequency will create invoices on January 1st, February 1st, March 1st, etc.
    </P>

    <SubsectionHeading>Managing Recurring Invoices</SubsectionHeading>

    <OL>
      <LI>Go to <Strong>Recurring Invoices</Strong></LI>
      <LI>Find the recurring invoice</LI>
      <LI>
        Click the <Strong>three-dot menu</Strong> to:
        <UL>
          <LI><Strong>Edit</Strong>: Change frequency, amount, or client</LI>
          <LI><Strong>Pause</Strong>: Temporarily stop creating invoices</LI>
          <LI><Strong>Resume</Strong>: Restart after pausing</LI>
          <LI><Strong>Delete</Strong>: Stop the recurring invoice</LI>
          <LI><Strong>View History</Strong>: See all invoices created from this template</LI>
        </UL>
      </LI>
    </OL>
  </div>
);
