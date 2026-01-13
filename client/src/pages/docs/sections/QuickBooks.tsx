import {
  VideoPlaceholder,
  SectionHeading,
  SubsectionHeading,
  P,
  UL,
  LI,
  Strong,
} from "../docComponents";

export const QuickBooks = () => (
  <div>
    <SectionHeading>QuickBooks Integration</SectionHeading>
    <VideoPlaceholder title="QuickBooks Integration Setup" />

    <SubsectionHeading>Connecting QuickBooks</SubsectionHeading>
    <P>Sync your SleekInvoices data with QuickBooks Online for seamless accounting:</P>
    <P>
      1. Go to <Strong>Settings</Strong> → <Strong>Integrations</Strong> → <Strong>QuickBooks</Strong><br />
      2. Click <Strong>Connect to QuickBooks</Strong><br />
      3. You'll be redirected to Intuit's login page<br />
      4. Log in with your QuickBooks account<br />
      5. Authorize SleekInvoices to access your QuickBooks data<br />
      6. You'll be redirected back to SleekInvoices
    </P>

    <SubsectionHeading>What Gets Synced</SubsectionHeading>
    <P>
      <Strong>Clients</Strong>: Your SleekInvoices clients are synced to QuickBooks as customers.
    </P>
    <P>
      <Strong>Invoices</Strong>: Invoices created in SleekInvoices are automatically synced to QuickBooks.
    </P>
    <P>
      <Strong>Payments</Strong>: When you record a payment in SleekInvoices, it syncs to QuickBooks.
    </P>
    <P>
      <Strong>Expenses</Strong>: Expenses can be synced for comprehensive financial tracking.
    </P>

    <SubsectionHeading>Sync Settings</SubsectionHeading>
    <P>Customize what and when data syncs:</P>
    <P>
      1. Go to <Strong>Settings</Strong> → <Strong>Integrations</Strong> → <Strong>QuickBooks</Strong><br />
      2. Configure:
    </P>
    <UL>
      <LI><Strong>Auto-Sync Invoices</Strong>: Automatically sync invoices when created</LI>
      <LI><Strong>Auto-Sync Payments</Strong>: Automatically sync payments when recorded</LI>
      <LI><Strong>Two-Way Payment Sync</Strong>: Import payments recorded in QuickBooks back to SleekInvoices</LI>
      <LI><Strong>Minimum Invoice Amount</Strong>: Only sync invoices above a certain amount</LI>
      <LI><Strong>Sync Draft Invoices</Strong>: Include draft invoices in sync</LI>
    </UL>
    <P>
      3. Click <Strong>Save Settings</Strong>
    </P>

    <SubsectionHeading>Manual Sync</SubsectionHeading>
    <P>To manually sync an invoice:</P>
    <P>
      1. Open the invoice<br />
      2. Click the <Strong>three-dot menu</Strong><br />
      3. Select <Strong>Sync to QuickBooks</Strong><br />
      4. The invoice syncs immediately
    </P>

    <SubsectionHeading>Disconnecting QuickBooks</SubsectionHeading>
    <P>
      1. Go to <Strong>Settings</Strong> → <Strong>Integrations</Strong> → <Strong>QuickBooks</Strong><br />
      2. Click <Strong>Disconnect</Strong><br />
      3. Confirm disconnection
    </P>
    <P>
      Future invoices won't sync, but historical data remains in QuickBooks.
    </P>
  </div>
);
