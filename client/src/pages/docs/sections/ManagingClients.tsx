import {
  SectionHeading,
  SubsectionHeading,
  P,
  OL,
  UL,
  LI,
  Strong,
} from "../docComponents";

export const ManagingClients = () => (
  <div>
    <SectionHeading>Managing Clients</SectionHeading>

    <SubsectionHeading>Adding Your First Client</SubsectionHeading>
    <OL>
      <LI>Click <Strong>Clients</Strong> in the main navigation</LI>
      <LI>Click <Strong>+ New Client</Strong> button</LI>
      <LI>
        Fill in the client details:
        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-muted-foreground">
          <li><Strong>Company Name</Strong> (required)</li>
          <li><Strong>Contact Name</Strong> (optional)</li>
          <li><Strong>Email Address</Strong> (required for sending invoices)</li>
          <li><Strong>Phone Number</Strong> (optional)</li>
          <li><Strong>Address</Strong> (optional)</li>
          <li><Strong>VAT Number</Strong> (for EU clients, enables reverse charge invoicing)</li>
          <li><Strong>Tax Exempt</Strong> (checkbox for non-taxable clients)</li>
        </ul>
      </LI>
      <LI>Click <Strong>Save Client</Strong></LI>
    </OL>

    <SubsectionHeading>Viewing All Clients</SubsectionHeading>
    <P>
      The <Strong>Clients</Strong> page displays all your clients in a searchable, sortable table. You can:
    </P>
    <P>
      <Strong>Search</Strong>: Type a client name, email, or company name to filter the list instantly.
    </P>
    <P>
      <Strong>Sort</Strong>: Click column headers to sort by name, email, date added, or other criteria.
    </P>
    <P>
      <Strong>Filter</Strong>: Use the filter panel to show only clients with specific tags or added within a date range.
    </P>
    <P>
      <Strong>Bulk Actions</Strong>: Select multiple clients using checkboxes and perform actions like adding tags or exporting to CSV.
    </P>

    <SubsectionHeading>Editing Client Information</SubsectionHeading>
    <OL>
      <LI>Find the client in the list</LI>
      <LI>Click the <Strong>three-dot menu</Strong> on the right</LI>
      <LI>Select <Strong>Edit</Strong></LI>
      <LI>Update any information</LI>
      <LI>Click <Strong>Save Changes</Strong></LI>
    </OL>

    <SubsectionHeading>Deleting Clients</SubsectionHeading>
    <OL>
      <LI>Click the <Strong>three-dot menu</Strong> next to the client</LI>
      <LI>Select <Strong>Delete</Strong></LI>
      <LI>Confirm the deletion</LI>
    </OL>
    <P>
      <Strong>Note</Strong>: Deleting a client does not delete their invoices. All invoice history remains intact for accounting purposes.
    </P>

    <SubsectionHeading>Client Tags & Categories</SubsectionHeading>
    <P>
      Organize clients by adding custom tags:
    </P>
    <OL>
      <LI>Click the <Strong>tag icon</Strong> next to a client name</LI>
      <LI>Create new tags or select existing ones</LI>
      <LI>Tags help you filter and organize clients by type (e.g., "Retainer Clients", "One-Time Projects")</LI>
    </OL>

    <SubsectionHeading>Sending Portal Access Links</SubsectionHeading>
    <P>
      Share a secure link with clients so they can view invoices and make payments:
    </P>
    <OL>
      <LI>Click the <Strong>key icon</Strong> next to a client</LI>
      <LI>Click <Strong>Generate Access Link</Strong></LI>
      <LI>Copy the link and send to your client</LI>
      <LI>The link expires after 30 days for security</LI>
    </OL>
  </div>
);
