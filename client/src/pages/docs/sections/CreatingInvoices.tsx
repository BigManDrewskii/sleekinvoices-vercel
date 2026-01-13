import {
  VideoPlaceholder,
  SectionHeading,
  SubsectionHeading,
  P,
  OL,
  UL,
  LI,
  Strong,
  CalloutBox,
} from "../docComponents";

export const CreatingInvoices = () => (
  <div>
    <SectionHeading>Creating & Sending Invoices</SectionHeading>
    <VideoPlaceholder title="Creating & Sending Invoices" />

    <SubsectionHeading>Three Ways to Create Invoices</SubsectionHeading>

    <h4 className="text-lg font-semibold text-foreground mb-3">Option 1: Magic Invoice (AI-Powered) - Fastest</h4>
    <OL>
      <LI>On the <Strong>Dashboard</Strong>, find the <Strong>Sleeky's Magic Invoice</Strong> section</LI>
      <LI>Type a description in plain English, e.g., "Website design project for Q1, 40 hours at $75/hour"</LI>
      <LI>Click <Strong>Generate Invoice</Strong></LI>
      <LI>Review the auto-populated invoice</LI>
      <LI>Adjust line items, amounts, or due date as needed</LI>
      <LI>Click <Strong>Save as Draft</Strong> or <Strong>Send Invoice</Strong></LI>
    </OL>
    <P>
      <Strong>AI Features</Strong>: The AI understands natural language, calculates totals, and suggests appropriate line items based on your description.
    </P>

    <h4 className="text-lg font-semibold text-foreground mb-3">Option 2: Smart Invoice Builder (Guided) - Recommended</h4>
    <OL>
      <LI>Click <Strong>New Invoice</Strong> on the Dashboard</LI>
      <LI>Select <Strong>Smart Invoice Builder</Strong></LI>
      <LI>
        Follow the 5-step flow:
        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
          <li><Strong>Step 1 - Client</Strong>: Select or create a client</li>
          <li><Strong>Step 2 - Services</Strong>: Add line items (description, quantity, rate)</li>
          <li><Strong>Step 3 - Amounts</Strong>: Review subtotal, adjust tax/discount if needed</li>
          <li><Strong>Step 4 - Due Date</Strong>: Choose due date (Due on Receipt, Net 15/30/60, or custom)</li>
          <li><Strong>Step 5 - Review</Strong>: Preview invoice and send or save as draft</li>
        </ul>
      </LI>
    </OL>

    <h4 className="text-lg font-semibold text-foreground mb-3">Option 3: Classic Form (Full Control)</h4>
    <OL>
      <LI>Click <Strong>New Invoice</Strong></LI>
      <LI>Select <Strong>Classic Form</Strong></LI>
      <LI>
        Fill in all fields:
        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
          <li><Strong>Client</Strong> (required)</li>
          <li><Strong>Invoice Number</Strong> (auto-generated, editable)</li>
          <li><Strong>Issue Date</Strong> (defaults to today)</li>
          <li><Strong>Due Date</Strong> (required)</li>
          <li><Strong>Line Items</Strong> (add multiple rows)</li>
          <li><Strong>Tax Rate</Strong> (percentage, optional)</li>
          <li><Strong>Discount</Strong> (percentage or fixed amount, optional)</li>
          <li><Strong>Notes</Strong> (optional, appears on invoice)</li>
          <li><Strong>Payment Terms</Strong> (optional, e.g., "Net 30")</li>
        </ul>
      </LI>
      <LI>Click <Strong>Save as Draft</Strong> to save without sending, or <Strong>Send Invoice</Strong> to email immediately</LI>
    </OL>

    <SubsectionHeading>Adding Line Items</SubsectionHeading>
    <P>
      Each invoice can have multiple line items:
    </P>
    <OL>
      <LI>Click <Strong>+ Add Line Item</Strong></LI>
      <LI>
        Enter:
        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
          <li><Strong>Description</Strong> (e.g., "Website Design Services")</li>
          <li><Strong>Quantity</Strong> (e.g., 10 hours)</li>
          <li><Strong>Rate</Strong> (e.g., $75/hour)</li>
        </ul>
      </LI>
      <LI>The total automatically calculates</LI>
      <LI>Add more items by clicking <Strong>+ Add Line Item</Strong> again</LI>
      <LI>Remove items by clicking the <Strong>trash icon</Strong></LI>
    </OL>

    <CalloutBox title="Pro Tip">
      Use consistent descriptions and rates across invoices for easier tracking and analytics.
    </CalloutBox>

    <SubsectionHeading>Applying Tax & Discounts</SubsectionHeading>
    <P>
      <Strong>Tax</Strong>: Enter a percentage (e.g., 10% for VAT). The tax applies to the subtotal after discounts.
    </P>
    <P>
      <Strong>Discount</Strong>: Enter either a percentage (e.g., 10% off) or a fixed amount (e.g., $50 off). Discounts apply before tax.
    </P>
    <P>
      <Strong>Reverse Charge (EU VAT)</Strong>: If your client has a VAT number and is in the EU, the invoice automatically shows "Reverse Charge" instead of charging tax. This is compliant with EU VAT regulations.
    </P>

    <SubsectionHeading>Saving vs. Sending</SubsectionHeading>
    <P>
      <Strong>Save as Draft</Strong>: The invoice is saved but not sent to the client. You can edit it anytime before sending. Drafts don't count toward your Free plan limit.
    </P>
    <P>
      <Strong>Send Invoice</Strong>: The invoice is saved and immediately emailed to the client. This counts as 1 invoice toward your Free plan limit (if applicable). The client receives a professional email with the invoice PDF attached.
    </P>

    <SubsectionHeading>Editing Invoices</SubsectionHeading>
    <OL>
      <LI>Go to <Strong>Invoices</Strong> in the main menu</LI>
      <LI>Find the invoice in the list</LI>
      <LI>Click the <Strong>three-dot menu</Strong> → <Strong>Edit</Strong></LI>
      <LI>Make changes to any field</LI>
      <LI>Click <Strong>Save Changes</Strong></LI>
    </OL>
    <P>
      <Strong>Note</Strong>: You can only edit invoices in Draft status. Once sent, you can create a revised version or credit memo instead.
    </P>

    <SubsectionHeading>Invoice Status Explained</SubsectionHeading>
    <P>
      <Strong>Draft</Strong>: Saved but not sent. You can edit freely and send anytime.
    </P>
    <P>
      <Strong>Sent</Strong>: Invoice was emailed to the client. The client can view it and make payments.
    </P>
    <P>
      <Strong>Viewed</Strong>: The client has opened the invoice (tracked via email or portal).
    </P>
    <P>
      <Strong>Partially Paid</Strong>: The client has paid part of the invoice amount.
    </P>
    <P>
      <Strong>Paid</Strong>: The full invoice amount has been received.
    </P>
    <P>
      <Strong>Overdue</Strong>: The due date has passed and payment is still pending.
    </P>
    <P>
      <Strong>Canceled</Strong>: The invoice was canceled and should not be paid.
    </P>
  </div>
);
