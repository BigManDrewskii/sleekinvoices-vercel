import {
  SectionHeading,
  SubsectionHeading,
  P,
  UL,
  LI,
  Strong,
  CalloutBox,
} from "../docComponents";

export const ClientPortal = () => (
  <div>
    <SectionHeading>Client Portal</SectionHeading>

    <SubsectionHeading>What is the Client Portal?</SubsectionHeading>
    <P>
      The Client Portal is a secure, branded space where clients can view invoices and make payments without needing a SleekInvoices account.
    </P>

    <SubsectionHeading>Sharing Portal Access</SubsectionHeading>
    <P>
      1. Go to <Strong>Clients</Strong><br />
      2. Find the client<br />
      3. Click the <Strong>key icon</Strong> (Portal Access)<br />
      4. Click <Strong>Generate Access Link</Strong><br />
      5. Copy the link<br />
      6. Send to your client via email or message
    </P>
    <P>
      The link is unique and secure. It expires after 30 days for security.
    </P>

    <SubsectionHeading>What Clients See</SubsectionHeading>
    <P>When clients access the portal, they can:</P>
    <UL>
      <LI>View all their invoices</LI>
      <LI>Download invoices as PDF</LI>
      <LI>See payment status and history</LI>
      <LI>Make payments with Stripe or cryptocurrency</LI>
      <LI>View invoice details and payment terms</LI>
    </UL>

    <CalloutBox title="Note">
      Clients see only their own invoices, not other clients' information.
    </CalloutBox>

    <SubsectionHeading>Portal Features</SubsectionHeading>
    <P>
      <Strong>Invoice List</Strong>: All invoices for the client with status indicators (Draft, Sent, Paid, Overdue).
    </P>
    <P>
      <Strong>Invoice Details</Strong>: Full invoice information including line items, tax, discounts, and payment options.
    </P>
    <P>
      <Strong>Payment Options</Strong>:
    </P>
    <UL>
      <LI>Stripe (credit/debit card)</LI>
      <LI>Cryptocurrency (Bitcoin, Ethereum, 300+ coins)</LI>
      <LI>Bank transfer details (if provided)</LI>
    </UL>
    <P>
      <Strong>Email Reminders</Strong>: Clients can opt-in to receive payment reminders.
    </P>
  </div>
);
