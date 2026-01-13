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

export const PaymentProcessing = () => (
  <div>
    <SectionHeading>Payment Processing</SectionHeading>
    <VideoPlaceholder title="Payment Processing" />

    <SubsectionHeading>Accepting Stripe Payments (Credit Cards)</SubsectionHeading>
    <P>
      Stripe is integrated directly into SleekInvoices. Your clients can pay invoices with any major credit card.
    </P>

    <P>
      <Strong>How Clients Pay</Strong>:
    </P>
    <OL>
      <LI>Client receives your invoice email</LI>
      <LI>Clicks <Strong>"Pay Now"</Strong> button in the email</LI>
      <LI>Redirected to Stripe checkout page</LI>
      <LI>Enters credit card details</LI>
      <LI>Payment is processed instantly</LI>
      <LI>Client receives confirmation email</LI>
      <LI>Your invoice status updates to <Strong>Paid</Strong></LI>
    </OL>

    <P>
      <Strong>Fees</Strong>: Stripe charges 2.9% + $0.30 per transaction. This is deducted from the payment amount.
    </P>

    <P>
      <Strong>Security</Strong>: All card data is handled by Stripe's PCI-compliant servers. Your business never sees card details.
    </P>

    <SubsectionHeading>Accepting Cryptocurrency Payments</SubsectionHeading>
    <P>
      SleekInvoices supports 300+ cryptocurrencies including Bitcoin, Ethereum, Litecoin, and stablecoins (USDC, USDT).
    </P>

    <P>
      <Strong>Why Cryptocurrency?</Strong>
    </P>
    <UL>
      <LI>No chargebacks (final settlement)</LI>
      <LI>Instant payment confirmation</LI>
      <LI>Lower fees (0.5-1%)</LI>
      <LI>Global payments without currency conversion</LI>
      <LI>Perfect for international clients</LI>
    </UL>

    <P>
      <Strong>How Clients Pay with Crypto</Strong>:
    </P>
    <OL>
      <LI>Client sees <Strong>"Pay with Crypto"</Strong> button on invoice</LI>
      <LI>Clicks to open crypto payment dialog</LI>
      <LI>Selects preferred cryptocurrency (Bitcoin, Ethereum, etc.)</LI>
      <LI>Selects blockchain network (Ethereum, Polygon, BSC, etc.)</LI>
      <LI>Receives payment address and QR code</LI>
      <LI>Sends cryptocurrency to the address</LI>
      <LI>Payment confirmed within minutes</LI>
      <LI>Your invoice updates to <Strong>Paid</Strong></LI>
    </OL>

    <CalloutBox title="Pro Tip">
      For Small Invoices: If the invoice is under $10, we recommend low-fee cryptocurrencies like Litecoin or USDT on Tron to minimize network fees.
    </CalloutBox>

    <P>
      <Strong>Receiving Payments</Strong>: Cryptocurrency payments are received in your specified wallet. You can hold crypto or convert to fiat currency on exchanges like Kraken, Coinbase, or Gemini.
    </P>

    <SubsectionHeading>Recording Manual Payments</SubsectionHeading>
    <P>
      If a client pays outside the platform (bank transfer, cash, check), record the payment manually:
    </P>

    <OL>
      <LI>Go to <Strong>Invoices</Strong> → find the invoice</LI>
      <LI>Click <Strong>Record Payment</Strong></LI>
      <LI>
        Enter:
        <UL>
          <LI><Strong>Amount Paid</Strong> (full or partial)</LI>
          <LI><Strong>Payment Date</Strong></LI>
          <LI><Strong>Payment Method</Strong> (Bank Transfer, Cash, Check, Other)</LI>
        </UL>
      </LI>
      <LI>Click <Strong>Record Payment</Strong></LI>
    </OL>

    <P>
      The invoice status updates automatically based on the amount paid.
    </P>

    <SubsectionHeading>Payment Reminders</SubsectionHeading>
    <P>
      Automatically send payment reminders to clients with unpaid invoices:
    </P>

    <OL>
      <LI>Go to <Strong>Settings</Strong> → <Strong>Reminders</Strong></LI>
      <LI>
        Configure:
        <UL>
          <LI><Strong>Reminder Intervals</Strong>: When to send reminders (3, 7, 14, or 30 days after due date)</LI>
          <LI><Strong>Reminder Email Template</Strong>: Customize the message</LI>
          <LI><Strong>Auto-Send</Strong>: Enable automatic sending</LI>
        </UL>
      </LI>
      <LI>Save settings</LI>
    </OL>

    <P>
      Reminders are sent automatically at the specified intervals. You can also manually send a reminder anytime from the invoice details page.
    </P>

    <SubsectionHeading>Payment History</SubsectionHeading>
    <P>
      View all payments for an invoice:
    </P>

    <OL>
      <LI>Open the invoice</LI>
      <LI>Scroll to <Strong>Payment History</Strong> section</LI>
      <LI>See all payments with dates, amounts, and methods</LI>
      <LI>Download payment receipts</LI>
    </OL>
  </div>
);
