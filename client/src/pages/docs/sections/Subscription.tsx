import {
  SectionHeading,
  SubsectionHeading,
  P,
  UL,
  LI,
  Strong,
} from "../docComponents";

export const Subscription = () => (
  <div>
    <SectionHeading>Subscription & Billing</SectionHeading>

    <SubsectionHeading>Understanding Plans</SubsectionHeading>
    <P>
      <Strong>Free Plan</Strong>: $0/month, 3 invoices/month, core features, no credit card required.
    </P>
    <P>
      <Strong>Pro Plan</Strong>: $12/month, unlimited invoices, all premium features, priority support.
    </P>

    <SubsectionHeading>Upgrading to Pro</SubsectionHeading>
    <P>
      1. Click your <Strong>avatar</Strong> in the top-right corner<br />
      2. Select <Strong>Subscription</Strong><br />
      3. Click <Strong>Upgrade to Pro</Strong><br />
      4. Choose payment method:
    </P>
    <UL>
      <LI><Strong>Credit Card</Strong>: Pay monthly via Stripe</LI>
      <LI><Strong>Cryptocurrency</Strong>: Pay with Bitcoin, Ethereum, or 300+ cryptocurrencies</LI>
    </UL>
    <P>
      5. Complete payment<br />
      6. Pro features activate immediately
    </P>

    <SubsectionHeading>Cryptocurrency Subscription Payment</SubsectionHeading>
    <P>If paying with crypto:</P>
    <P>
      1. Select your preferred cryptocurrency<br />
      2. Choose subscription duration (1, 3, 6, or 12 months)<br />
      3. Receive payment address and QR code<br />
      4. Send cryptocurrency to the address<br />
      5. Payment confirmed within minutes<br />
      6. Pro tier activates
    </P>
    <P><Strong>Pricing Tiers</Strong>:</P>
    <UL>
      <LI>1 month: $10</LI>
      <LI>3 months: $28.50 (5% discount)</LI>
      <LI>6 months: $54 (10% discount)</LI>
      <LI>12 months: $102 (15% discount)</LI>
    </UL>

    <SubsectionHeading>Managing Your Subscription</SubsectionHeading>
    <P>
      1. Go to <Strong>Subscription</Strong> page<br />
      2. View:
    </P>
    <UL>
      <LI>Current plan and renewal date</LI>
      <LI>Billing history</LI>
      <LI>Invoice usage (Free plan only)</LI>
      <LI>Payment methods</LI>
    </UL>
    <P>3. Options:</P>
    <UL>
      <LI><Strong>Extend with Crypto</Strong>: Add more months to your subscription</LI>
      <LI><Strong>Manage Billing</Strong>: Update payment method or cancel</LI>
    </UL>

    <SubsectionHeading>Canceling Your Subscription</SubsectionHeading>
    <P>
      1. Go to <Strong>Subscription</Strong><br />
      2. Click <Strong>Manage Billing</Strong><br />
      3. Select <Strong>Cancel Subscription</Strong><br />
      4. Confirm cancellation
    </P>
    <P>
      You'll revert to the Free plan at the end of your current billing period. All data is preserved.
    </P>

    <SubsectionHeading>AI Credit Purchases</SubsectionHeading>
    <P>AI credits are separate from your subscription:</P>
    <P>
      <Strong>Free Plan</Strong>: 5 AI credits/month for Magic Invoice.
    </P>
    <P>
      <Strong>Pro Plan</Strong>: 50 AI credits/month.
    </P>
    <P><Strong>Purchase Additional Credits</Strong>:</P>
    <P>
      1. Go to <Strong>Dashboard</Strong> → <Strong>Magic Invoice</Strong> section<br />
      2. If low on credits, click <Strong>Top Up Credits</Strong><br />
      3. Choose a credit pack:
    </P>
    <UL>
      <LI>Starter: 25 credits for $2.99</LI>
      <LI>Standard: 100 credits for $9.99</LI>
      <LI>Pro: 500 credits for $39.99</LI>
    </UL>
    <P>
      4. Complete payment<br />
      5. Credits added immediately
    </P>
  </div>
);
