import {
  SectionHeading,
  SubsectionHeading,
  P,
  Strong,
} from "../docComponents";

export const FAQ = () => (
  <div>
    <SectionHeading>FAQ</SectionHeading>

    <SubsectionHeading>General Questions</SubsectionHeading>
    <P>
      <Strong>Q: Is SleekInvoices secure?</Strong>
    </P>
    <P>
      A: Yes. We use industry-standard encryption, secure authentication, and PCI-compliant payment processing. Your data is encrypted in transit and at rest. We never store credit card information.
    </P>

    <P>
      <Strong>Q: Can I export my data?</Strong>
    </P>
    <P>
      A: Yes. Go to <Strong>Settings</Strong> → <Strong>Download My Data</Strong> to export all your invoices, clients, expenses, and other data in JSON or CSV format.
    </P>

    <P>
      <Strong>Q: What happens to my data if I cancel?</Strong>
    </P>
    <P>
      A: Your data is preserved indefinitely. You can reactivate your account anytime and access all historical data. Only if you explicitly request account deletion is your data removed.
    </P>

    <P>
      <Strong>Q: Is there a contract or lock-in period?</Strong>
    </P>
    <P>
      A: No. SleekInvoices is month-to-month with no long-term contracts. Cancel anytime with no penalties.
    </P>

    <SubsectionHeading>Invoicing Questions</SubsectionHeading>
    <P>
      <Strong>Q: Can I create invoices in different currencies?</Strong>
    </P>
    <P>
      A: Yes. When creating an invoice, select the currency (USD, EUR, GBP, BTC, ETH, etc.). The invoice displays in that currency.
    </P>

    <P>
      <Strong>Q: Can I send invoices to multiple clients at once?</Strong>
    </P>
    <P>
      A: Not in a single action, but you can create recurring invoices for regular clients or use batch invoicing for multiple invoices in one workflow.
    </P>

    <P>
      <Strong>Q: Can I edit an invoice after sending?</Strong>
    </P>
    <P>
      A: No, but you can create a revised version or credit memo. Go to the invoice → <Strong>three-dot menu</Strong> → <Strong>Create Revised Invoice</Strong> or <Strong>Create Credit Memo</Strong>.
    </P>

    <P>
      <Strong>Q: What if a client pays partially?</Strong>
    </P>
    <P>
      A: Record the partial payment, and the invoice status changes to "Partially Paid". The outstanding balance is still tracked. Send reminders for the remaining amount.
    </P>

    <SubsectionHeading>Payment Questions</SubsectionHeading>
    <P>
      <Strong>Q: Which payment methods do you support?</Strong>
    </P>
    <P>
      A: Stripe (credit/debit cards), cryptocurrency (300+ coins), and manual bank transfers. Clients can choose their preferred method.
    </P>

    <P>
      <Strong>Q: How long does it take to receive payments?</Strong>
    </P>
    <P>
      A: Stripe payments settle within 1-2 business days. Cryptocurrency payments confirm within minutes. Manual transfers depend on the client's bank.
    </P>

    <P>
      <Strong>Q: Do you charge fees for payments?</Strong>
    </P>
    <P>
      A: Stripe charges 2.9% + $0.30 per transaction. Cryptocurrency charges 0.5-1% (NOWPayments fee). These are deducted from the payment amount. Manual transfers have no fee.
    </P>

    <P>
      <Strong>Q: Can I accept payments without using Stripe?</Strong>
    </P>
    <P>
      A: Yes. You can provide bank transfer details or accept cryptocurrency. Clients can also pay via the client portal using any method you enable.
    </P>

    <SubsectionHeading>Subscription Questions</SubsectionHeading>
    <P>
      <Strong>Q: Can I change my plan anytime?</Strong>
    </P>
    <P>
      A: Yes. Upgrade to Pro anytime, and downgrade at the end of your billing period. Changes take effect immediately.
    </P>

    <P>
      <Strong>Q: What happens if I exceed the Free plan limit?</Strong>
    </P>
    <P>
      A: You can't create more than 3 invoices in a month on the Free plan. Upgrade to Pro to remove the limit.
    </P>

    <P>
      <Strong>Q: Can I pay for Pro with cryptocurrency?</Strong>
    </P>
    <P>
      A: Yes. On the Subscription page, select "Pay with Crypto" and choose your preferred cryptocurrency and subscription duration.
    </P>

    <P>
      <Strong>Q: Is there a discount for annual billing?</Strong>
    </P>
    <P>
      A: Yes. If paying with cryptocurrency, annual billing (12 months) costs $102 instead of $144 (15% discount).
    </P>

    <SubsectionHeading>AI Features Questions</SubsectionHeading>
    <P>
      <Strong>Q: How does Magic Invoice work?</Strong>
    </P>
    <P>
      A: Describe your invoice in plain English (e.g., "10 hours of web design at $75/hour"), and our AI parses the description, creates line items, and calculates totals automatically.
    </P>

    <P>
      <Strong>Q: How many AI credits do I get?</Strong>
    </P>
    <P>
      A: Free plan: 5 credits/month. Pro plan: 50 credits/month. Each invoice generation uses 1 credit. Purchase additional credits anytime.
    </P>

    <P>
      <Strong>Q: Can I use Magic Invoice without AI credits?</Strong>
    </P>
    <P>
      A: No, Magic Invoice requires AI credits. Use the Smart Invoice Builder or Classic Form as alternatives (no credits required).
    </P>

    <P>
      <Strong>Q: How accurate is the AI?</Strong>
    </P>
    <P>
      A: The AI is highly accurate for standard invoices. For complex scenarios, review the generated invoice before sending. You can always edit line items manually.
    </P>

    <SubsectionHeading>Client Portal Questions</SubsectionHeading>
    <P>
      <Strong>Q: Is the client portal secure?</Strong>
    </P>
    <P>
      A: Yes. Portal access requires a unique, time-limited link. Clients see only their own invoices. Links expire after 30 days.
    </P>

    <P>
      <Strong>Q: Can clients create accounts?</Strong>
    </P>
    <P>
      A: No. Clients access the portal via a unique link without creating an account. This simplifies the experience.
    </P>

    <P>
      <Strong>Q: Can I customize the client portal branding?</Strong>
    </P>
    <P>
      A: Yes. Your company logo, colors, and custom footer appear in the client portal, matching your invoice templates.
    </P>

    <SubsectionHeading>Integration Questions</SubsectionHeading>
    <P>
      <Strong>Q: Does SleekInvoices integrate with QuickBooks?</Strong>
    </P>
    <P>
      A: Yes. Connect your QuickBooks Online account to automatically sync invoices, clients, and payments.
    </P>

    <P>
      <Strong>Q: Does SleekInvoices integrate with accounting software?</Strong>
    </P>
    <P>
      A: Currently, QuickBooks is our primary integration. We're working on Xero and other platforms. You can export data to CSV for manual import into other software.
    </P>

    <P>
      <Strong>Q: Can I integrate with my website or app?</Strong>
    </P>
    <P>
      A: Not directly, but you can export data via CSV or use the client portal link on your website.
    </P>

    <SubsectionHeading>Data & Privacy Questions</SubsectionHeading>
    <P>
      <Strong>Q: Where is my data stored?</Strong>
    </P>
    <P>
      A: Your data is stored on secure, encrypted servers in the United States. We use industry-standard security practices and regular backups.
    </P>

    <P>
      <Strong>Q: Can I delete my account?</Strong>
    </P>
    <P>
      A: Yes. Go to <Strong>Settings</Strong> → <Strong>Delete My Account</Strong> and follow the confirmation steps. All your data will be permanently deleted.
    </P>

    <P>
      <Strong>Q: Do you sell my data?</Strong>
    </P>
    <P>
      A: No. We never sell or share your data with third parties. See our Privacy Policy for details.
    </P>

    <P>
      <Strong>Q: Is my data GDPR compliant?</Strong>
    </P>
    <P>
      A: Yes. We comply with GDPR, CCPA, and other data protection regulations. You can request a data export or deletion anytime.
    </P>

    <SubsectionHeading>Troubleshooting Questions</SubsectionHeading>
    <P>
      <Strong>Q: Why is my invoice number not sequential?</Strong>
    </P>
    <P>
      A: Invoice numbers are sequential per user, but if you delete a draft invoice, the number is skipped. This is intentional to prevent number reuse.
    </P>

    <P>
      <Strong>Q: Why did my email bounce?</Strong>
    </P>
    <P>
      A: Common reasons: incorrect email address, client's email server blocking our domain, or client's mailbox full. Verify the email address and resend.
    </P>

    <P>
      <Strong>Q: Why is my payment not showing up?</Strong>
    </P>
    <P>
      A: Stripe payments take 1-2 business days to settle. Cryptocurrency payments confirm within minutes. Check your Stripe dashboard or blockchain explorer.
    </P>

    <P>
      <Strong>Q: How do I contact support?</Strong>
    </P>
    <P>
      A: Click the <Strong>help icon</Strong> in the app or email support@sleekinvoices.com. We respond within 24 hours.
    </P>
  </div>
);
