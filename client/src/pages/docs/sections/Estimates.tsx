import {
  SectionHeading,
  SubsectionHeading,
  P,
  OL,
  UL,
  LI,
  Strong,
} from "../docComponents";

export const Estimates = () => (
  <div>
    <SectionHeading>Estimates & Quotes</SectionHeading>

    <SubsectionHeading>Creating Estimates</SubsectionHeading>
    <P>
      Estimates (also called quotes or proposals) are perfect for presenting pricing before invoicing:
    </P>

    <OL>
      <LI>Click <Strong>Estimates</Strong> in the main menu</LI>
      <LI>Click <Strong>+ New Estimate</Strong></LI>
      <LI>
        Fill in:
        <UL>
          <LI><Strong>Client</Strong> (required)</LI>
          <LI><Strong>Estimate Number</Strong> (auto-generated)</LI>
          <LI><Strong>Issue Date</Strong></LI>
          <LI><Strong>Expiry Date</Strong> (when the estimate expires)</LI>
          <LI><Strong>Line Items</Strong> (same as invoices)</LI>
          <LI><Strong>Tax & Discount</Strong> (optional)</LI>
          <LI><Strong>Notes</Strong> (e.g., "Valid for 30 days")</LI>
        </UL>
      </LI>
      <LI>Click <Strong>Save as Draft</Strong> or <Strong>Send Estimate</Strong></LI>
    </OL>

    <SubsectionHeading>Converting Estimates to Invoices</SubsectionHeading>
    <P>
      Once a client accepts an estimate:
    </P>

    <OL>
      <LI>Open the estimate</LI>
      <LI>Click <Strong>Convert to Invoice</Strong></LI>
      <LI>Review the pre-populated invoice</LI>
      <LI>Adjust due date and payment terms</LI>
      <LI>Click <Strong>Create Invoice</Strong></LI>
    </OL>

    <P>
      The estimate status changes to <Strong>Converted</Strong> and a new invoice is created.
    </P>

    <SubsectionHeading>Estimate Status</SubsectionHeading>

    <P>
      <Strong>Draft</Strong>: Saved but not sent.
    </P>

    <P>
      <Strong>Sent</Strong>: Emailed to client.
    </P>

    <P>
      <Strong>Viewed</Strong>: Client has opened the estimate.
    </P>

    <P>
      <Strong>Accepted</Strong>: Client has converted to invoice (estimate is now closed).
    </P>

    <P>
      <Strong>Expired</Strong>: The expiry date has passed without conversion.
    </P>

    <P>
      <Strong>Declined</Strong>: Client rejected the estimate.
    </P>
  </div>
);
