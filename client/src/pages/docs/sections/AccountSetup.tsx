import {
  SectionHeading,
  SubsectionHeading,
  P,
  OL,
  LI,
  Strong,
  CalloutBox,
} from "../docComponents";

export const AccountSetup = () => (
  <div>
    <SectionHeading>Account Setup</SectionHeading>

    <SubsectionHeading>Creating Your Account</SubsectionHeading>
    <OL>
      <LI>Visit <Strong>SleekInvoices.com</Strong> and click <Strong>"Start Free"</Strong></LI>
      <LI>Choose your sign-up method (email, Google, or GitHub)</LI>
      <LI>Verify your email address</LI>
      <LI>You're ready to go! Your account is automatically created with the Free plan</LI>
    </OL>

    <SubsectionHeading>Completing Your Profile</SubsectionHeading>
    <P>
      Your profile information appears on every invoice you send. To set it up:
    </P>
    <OL>
      <LI>Click the <Strong>avatar icon</Strong> in the top-right corner</LI>
      <LI>Select <Strong>Settings</Strong></LI>
      <LI>
        Under the <Strong>Profile</Strong> tab, enter:
        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
          <li>Your full name</li>
          <li>Email address</li>
          <li>Phone number (optional)</li>
        </ul>
      </LI>
    </OL>

    <SubsectionHeading>Setting Up Company Information</SubsectionHeading>
    <P>
      Your company details appear in the "From" section of invoices:
    </P>
    <OL>
      <LI>Go to <Strong>Settings</Strong> → <Strong>Company Info</Strong></LI>
      <LI>Enter your company name</LI>
      <LI>Add your company address (street, city, state, zip)</LI>
      <LI>Add your VAT/Tax ID number (if applicable)</LI>
      <LI>Upload your company logo (PNG, JPG, or SVG)</LI>
    </OL>

    <CalloutBox title="Pro Tip">
      Your logo appears on all invoices and in your client portal. Use a high-quality image for professional appearance.
    </CalloutBox>

    <SubsectionHeading>Customizing Invoice Appearance</SubsectionHeading>
    <OL>
      <LI>Navigate to <Strong>Templates</Strong> in the main menu</LI>
      <LI>Choose between <Strong>Receipt Style</Strong> (thermal receipt aesthetic) or <Strong>Classic</Strong> (traditional invoice)</LI>
      <LI>
        Customize:
        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
          <li>Primary color (accent color auto-generates)</li>
          <li>Heading and body fonts</li>
          <li>Date format (MM/DD/YYYY, DD/MM/YYYY, etc.)</li>
          <li>Field visibility (show/hide company address, payment terms, tax, discount, notes)</li>
          <li>Custom footer text</li>
        </ul>
      </LI>
    </OL>
    <P>
      Changes apply to all new invoices immediately.
    </P>
  </div>
);
