import {
  SectionHeading,
  SubsectionHeading,
  P,
  UL,
  LI,
  Strong,
} from "../docComponents";

export const Troubleshooting = () => (
  <div>
    <SectionHeading>Troubleshooting</SectionHeading>

    <SubsectionHeading>Invoices Not Sending</SubsectionHeading>
    <P>
      <Strong>Problem</Strong>: Invoice email doesn't arrive in client's inbox.
    </P>
    <P><Strong>Solutions</Strong>:</P>
    <UL>
      <LI>Check the client's email address is correct (go to <Strong>Clients</Strong> and verify)</LI>
      <LI>Ask the client to check spam/junk folder</LI>
      <LI>Resend the invoice from the invoice details page</LI>
      <LI>Verify your email domain is configured (go to <Strong>Settings</Strong> → <Strong>Email</Strong>)</LI>
    </UL>

    <SubsectionHeading>Payment Not Received</SubsectionHeading>
    <P>
      <Strong>Problem</Strong>: Client says they paid but invoice still shows unpaid.
    </P>
    <P><Strong>Solutions</Strong>:</P>
    <UL>
      <LI>Check your Stripe account for the payment (log into Stripe dashboard)</LI>
      <LI>Manually record the payment in SleekInvoices (go to invoice → <Strong>Record Payment</Strong>)</LI>
      <LI>For crypto payments, verify the transaction on the blockchain using the transaction hash</LI>
      <LI>Contact support if payment appears in Stripe but not in SleekInvoices</LI>
    </UL>

    <SubsectionHeading>Crypto Payment Not Confirming</SubsectionHeading>
    <P>
      <Strong>Problem</Strong>: Client sent cryptocurrency but payment not confirmed.
    </P>
    <P><Strong>Solutions</Strong>:</P>
    <UL>
      <LI>Verify the transaction on the blockchain (Bitcoin, Ethereum explorer)</LI>
      <LI>Check that the correct amount was sent (including network fees)</LI>
      <LI>Ensure the payment was sent to the correct wallet address</LI>
      <LI>Some networks take 10-30 minutes to confirm; wait longer</LI>
      <LI>Contact support with the transaction hash for investigation</LI>
    </UL>

    <SubsectionHeading>QuickBooks Sync Issues</SubsectionHeading>
    <P>
      <Strong>Problem</Strong>: Invoice didn't sync to QuickBooks.
    </P>
    <P><Strong>Solutions</Strong>:</P>
    <UL>
      <LI>Verify QuickBooks is still connected (go to <Strong>Settings</Strong> → <Strong>Integrations</Strong>)</LI>
      <LI>Check sync settings are enabled for that invoice type</LI>
      <LI>Manually sync by clicking the <Strong>three-dot menu</Strong> → <Strong>Sync to QuickBooks</Strong></LI>
      <LI>Ensure the client exists in QuickBooks (sync clients first)</LI>
      <LI>Disconnect and reconnect QuickBooks if issues persist</LI>
    </UL>

    <SubsectionHeading>AI Magic Invoice Not Working</SubsectionHeading>
    <P>
      <Strong>Problem</Strong>: Magic Invoice doesn't generate or generates incorrect results.
    </P>
    <P><Strong>Solutions</Strong>:</P>
    <UL>
      <LI>Verify you have AI credits remaining (check Dashboard)</LI>
      <LI>Ensure your description is clear and specific (e.g., "10 hours of web design at $75/hour")</LI>
      <LI>Try a simpler description if the AI seems confused</LI>
      <LI>Use the Smart Invoice Builder as an alternative</LI>
      <LI>Contact support if the issue persists</LI>
    </UL>

    <SubsectionHeading>Free Plan Invoice Limit</SubsectionHeading>
    <P>
      <Strong>Problem</Strong>: "Monthly invoice limit reached" error when creating invoice.
    </P>
    <P><Strong>Solutions</Strong>:</P>
    <UL>
      <LI>You've created 3 invoices this month on the Free plan</LI>
      <LI>Upgrade to Pro for unlimited invoices ($12/month)</LI>
      <LI>Wait until next month for your limit to reset</LI>
      <LI>Delete draft invoices to free up space (only sent invoices count toward limit)</LI>
    </UL>

    <SubsectionHeading>Slow Performance</SubsectionHeading>
    <P>
      <Strong>Problem</Strong>: App is loading slowly or pages are sluggish.
    </P>
    <P><Strong>Solutions</Strong>:</P>
    <UL>
      <LI>Clear your browser cache (Ctrl+Shift+Delete on Windows, Cmd+Shift+Delete on Mac)</LI>
      <LI>Try a different browser (Chrome, Firefox, Safari, Edge)</LI>
      <LI>Check your internet connection speed</LI>
      <LI>Disable browser extensions that might interfere</LI>
      <LI>Contact support if issues persist</LI>
    </UL>

    <SubsectionHeading>Lost Data</SubsectionHeading>
    <P>
      <Strong>Problem</Strong>: Invoice or client data is missing.
    </P>
    <P><Strong>Solutions</Strong>:</P>
    <UL>
      <LI>Check if you're logged into the correct account</LI>
      <LI>Use the search function to find the data</LI>
      <LI>Check if the data was deleted (deleted items can sometimes be recovered)</LI>
      <LI>Contact support immediately with details about the missing data</LI>
    </UL>
  </div>
);
