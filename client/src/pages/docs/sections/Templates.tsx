import {
  SectionHeading,
  SubsectionHeading,
  P,
  OL,
  UL,
  LI,
  Strong,
} from "../docComponents";

export const Templates = () => (
  <div>
    <SectionHeading>Invoice Templates</SectionHeading>

    <SubsectionHeading>Template Styles</SubsectionHeading>
    <P>
      SleekInvoices offers two professional invoice styles:
    </P>

    <P>
      <Strong>Receipt Style</Strong>: Thermal receipt aesthetic with monospace font, minimal design, and clean tabular layout. Perfect for service-based businesses and consultants.
    </P>

    <P>
      <Strong>Classic Style</Strong>: Traditional invoice format with company header, professional typography, and spacious layout. Ideal for product-based businesses and corporate invoicing.
    </P>

    <SubsectionHeading>Customizing Templates</SubsectionHeading>

    <OL>
      <LI>Click <Strong>Templates</Strong> in the main menu</LI>
      <LI>Select a template to customize</LI>
      <LI>
        Adjust:
        <UL>
          <LI><Strong>Primary Color</Strong>: Main accent color (secondary color auto-generates)</LI>
          <LI><Strong>Heading Font</Strong>: Font for invoice title, client name, etc.</LI>
          <LI><Strong>Body Font</Strong>: Font for descriptions and details</LI>
          <LI><Strong>Font Size</Strong>: Adjust readability</LI>
          <LI><Strong>Date Format</Strong>: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.</LI>
          <LI><Strong>Field Visibility</Strong>: Show/hide company address, payment terms, tax, discount, notes</LI>
          <LI><Strong>Custom Footer</Strong>: Add your own message or legal text</LI>
          <LI><Strong>Logo</Strong>: Upload and position your company logo</LI>
        </UL>
      </LI>
      <LI>See changes in real-time preview</LI>
      <LI>Click <Strong>Save Template</Strong></LI>
    </OL>

    <SubsectionHeading>Applying Templates to Invoices</SubsectionHeading>
    <P>
      When creating an invoice, select which template to use:
    </P>

    <OL>
      <LI>Create a new invoice</LI>
      <LI>In the preview panel, click <Strong>Change Template</Strong></LI>
      <LI>Select from your available templates</LI>
      <LI>The invoice updates with the selected template's styling</LI>
    </OL>
  </div>
);
