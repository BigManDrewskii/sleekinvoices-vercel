import {
  SectionHeading,
  SubsectionHeading,
  P,
  UL,
  LI,
  Strong,
  CalloutBox,
} from "../docComponents";

export const BestPractices = () => (
  <div>
    <SectionHeading>Best Practices</SectionHeading>

    <SubsectionHeading>Invoice Numbering</SubsectionHeading>
    <P>
      Use consistent, sequential invoice numbering for professional appearance and easy tracking. SleekInvoices auto-generates numbers, but you can customize the format:
    </P>
    <UL>
      <LI>Simple: INV-001, INV-002, INV-003</LI>
      <LI>With Year: INV-2024-001, INV-2024-002</LI>
      <LI>With Client Code: INV-ACME-001, INV-ACME-002</LI>
    </UL>
    <CalloutBox title="Pro Tip">
      Never reuse invoice numbers. If you need to void an invoice, create a credit memo instead.
    </CalloutBox>

    <SubsectionHeading>Payment Terms</SubsectionHeading>
    <P>Clearly communicate payment expectations:</P>
    <UL>
      <LI><Strong>Due on Receipt</Strong>: Payment expected immediately (good for one-time projects)</LI>
      <LI><Strong>Net 15</Strong>: Payment due within 15 days (standard for many businesses)</LI>
      <LI><Strong>Net 30</Strong>: Payment due within 30 days (common for corporate clients)</LI>
      <LI><Strong>Net 60</Strong>: Payment due within 60 days (for established clients)</LI>
    </UL>
    <P>Include payment terms on every invoice to avoid confusion.</P>

    <SubsectionHeading>Tax Compliance</SubsectionHeading>
    <P>
      <Strong>Sales Tax</Strong>: If you're required to collect sales tax, add it as a line item or percentage on invoices.
    </P>
    <P>
      <Strong>VAT (EU)</Strong>: If you're in the EU and your client is in another EU country with a valid VAT number, use the reverse charge mechanism. SleekInvoices handles this automatically.
    </P>
    <P>
      <Strong>1099/Invoicing</Strong>: Keep detailed records of all invoices for tax filing. Export your data quarterly for accounting.
    </P>

    <SubsectionHeading>Client Communication</SubsectionHeading>
    <P>
      <Strong>Professional Tone</Strong>: Use clear, professional language in invoice notes and email templates.
    </P>
    <P>
      <Strong>Timely Invoicing</Strong>: Send invoices immediately after completing work to improve payment speed.
    </P>
    <P>
      <Strong>Payment Reminders</Strong>: Enable automatic reminders 7-14 days after the due date to prompt payment without being aggressive.
    </P>
    <P>
      <Strong>Follow-Up</Strong>: For invoices overdue by 30+ days, send a personal message to the client.
    </P>

    <SubsectionHeading>Financial Management</SubsectionHeading>
    <P>
      <Strong>Monitor Cash Flow</Strong>: Check your <Strong>Outstanding Balance</Strong> on the Dashboard weekly to track receivables.
    </P>
    <P>
      <Strong>Review Analytics</Strong>: Monthly, review the <Strong>Analytics</Strong> page to understand revenue trends and identify slow-paying clients.
    </P>
    <P>
      <Strong>Categorize Expenses</Strong>: Properly categorize expenses for accurate profit/loss reporting and tax deductions.
    </P>
    <P>
      <Strong>Reconcile Payments</Strong>: Regularly verify that payments recorded in SleekInvoices match your bank account.
    </P>

    <SubsectionHeading>Security</SubsectionHeading>
    <P>
      <Strong>Strong Passwords</Strong>: Use a unique, strong password for your SleekInvoices account.
    </P>
    <P>
      <Strong>Two-Factor Authentication</Strong>: Enable 2FA in Settings for additional security.
    </P>
    <P>
      <Strong>Secure Client Data</Strong>: Don't share client portals publicly. Send links directly to clients.
    </P>
    <P>
      <Strong>Regular Backups</Strong>: Export your data quarterly as a backup.
    </P>
  </div>
);
