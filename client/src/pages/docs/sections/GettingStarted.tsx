import {
  VideoPlaceholder,
  SectionHeading,
  SubsectionHeading,
  P,
  UL,
  LI,
  Strong,
  CalloutBox,
} from "../docComponents";

export const GettingStarted = () => (
  <div>
    <SectionHeading>Getting Started</SectionHeading>
    <VideoPlaceholder title="Getting Started with SleekInvoices" />

    <SubsectionHeading>What is SleekInvoices?</SubsectionHeading>
    <P>
      SleekInvoices is a professional invoicing platform that combines powerful features with an intuitive interface. Whether you're a freelancer managing a handful of clients or a small business handling dozens of invoices monthly, SleekInvoices streamlines your billing workflow and helps you get paid faster.
    </P>

    <SubsectionHeading>Key Benefits</SubsectionHeading>
    <UL>
      <LI>
        <Strong>Speed & Simplicity</Strong>: Create professional invoices in 30 seconds using our AI-powered Magic Invoice feature or traditional forms. No complex setup required.
      </LI>
      <LI>
        <Strong>Multiple Payment Options</Strong>: Accept payments via credit card through Stripe, cryptocurrency (Bitcoin, Ethereum, and 300+ coins), or traditional bank transfers. Your clients choose their preferred method.
      </LI>
      <LI>
        <Strong>Automatic Reminders</Strong>: Never chase late payments again. SleekInvoices automatically sends payment reminders at intervals you customize, from 3 to 30 days after invoice due dates.
      </LI>
      <LI>
        <Strong>Professional Templates</Strong>: Choose from multiple invoice styles (Receipt-style, Classic, or custom designs) and customize colors, fonts, and branding to match your business.
      </LI>
      <LI>
        <Strong>Real-Time Analytics</Strong>: Track revenue trends, outstanding balances, and client profitability with interactive charts and detailed reports.
      </LI>
      <LI>
        <Strong>Client Portal</Strong>: Share a secure link with your clients so they can view invoices and make payments directly without needing an account.
      </LI>
    </UL>

    <SubsectionHeading>Pricing</SubsectionHeading>
    <P>
      <Strong>Free Plan</Strong>: Start with 3 invoices per month at no cost. Perfect for testing the platform and managing small workloads. No credit card required, and you can cancel anytime.
    </P>
    <P>
      <Strong>Pro Plan</Strong>: $12/month for unlimited invoices, all premium features, and priority support. Upgrade anytime to unlock the full power of SleekInvoices.
    </P>

    <CalloutBox title="Pro Tip">
      Start with the free plan to test the platform. You can upgrade to Pro at any time with just a few clicks, and there's no contract or lock-in period.
    </CalloutBox>
  </div>
);
