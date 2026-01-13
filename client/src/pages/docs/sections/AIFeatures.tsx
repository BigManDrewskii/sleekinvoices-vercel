import {
  VideoPlaceholder,
  SectionHeading,
  SubsectionHeading,
  P,
  OL,
  UL,
  LI,
  Strong,
} from "../docComponents";

export const AIFeatures = () => (
  <div>
    <SectionHeading>AI-Powered Features</SectionHeading>
    <VideoPlaceholder title="AI-Powered Features" />

    <SubsectionHeading>Magic Invoice (AI Invoice Creator)</SubsectionHeading>
    <P>
      <Strong>What It Does</Strong>: Describe your invoice in plain English, and our AI instantly creates a professional invoice with line items, calculations, and formatting.
    </P>
    <P>
      <Strong>How to Use</Strong>:
    </P>
    <OL>
      <LI>Go to <Strong>Dashboard</Strong> → <Strong>Sleeky's Magic Invoice</Strong> section</LI>
      <LI>
        Type a description like:
        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
          <li>"Website redesign project, 40 hours at $75/hour, plus $500 design consultation"</li>
          <li>"Monthly retainer for social media management, $2,000"</li>
          <li>"3 hours of consulting at $150/hour plus $200 software license"</li>
        </ul>
      </LI>
      <LI>Click <Strong>Generate Invoice</Strong></LI>
      <LI>
        The AI creates a complete invoice with:
        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
          <li>Parsed line items</li>
          <li>Calculated totals</li>
          <li>Suggested due date</li>
          <li>Professional formatting</li>
        </ul>
      </LI>
      <LI>Review and adjust as needed</LI>
      <LI>Send or save as draft</LI>
    </OL>

    <P>
      <Strong>AI Capabilities</Strong>:
    </P>
    <UL>
      <LI>Understands natural language descriptions</LI>
      <LI>Calculates quantities and rates</LI>
      <LI>Recognizes common service types</LI>
      <LI>Suggests appropriate line item descriptions</LI>
      <LI>Handles complex scenarios (hourly rates, fixed fees, packages)</LI>
    </UL>

    <P>
      <Strong>AI Credits</Strong>: Free plan users get 5 AI credits/month. Pro users get 50 credits/month. Each invoice generation uses 1 credit. Purchase additional credits anytime.
    </P>

    <SubsectionHeading>AI Chat Assistant</SubsectionHeading>
    <P>
      Access our AI assistant by clicking the <Strong>Sleeky avatar</Strong> (otter icon) in the bottom-right corner. Ask questions about:
    </P>
    <UL>
      <LI>How to create an invoice</LI>
      <LI>Invoice best practices</LI>
      <LI>Payment troubleshooting</LI>
      <LI>Feature explanations</LI>
      <LI>Business advice</LI>
    </UL>
    <P>
      The assistant provides instant, contextual help without leaving the app.
    </P>

    <SubsectionHeading>Smart Suggestions</SubsectionHeading>
    <P>
      As you create invoices, the AI suggests:
    </P>
    <UL>
      <LI>Common line item descriptions based on your history</LI>
      <LI>Appropriate tax rates for your location</LI>
      <LI>Typical payment terms for your industry</LI>
      <LI>Due dates based on client payment history</LI>
    </UL>
  </div>
);
