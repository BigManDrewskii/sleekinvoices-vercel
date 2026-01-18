import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Resend at module level
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

// Import after mocking
import {
  sendInvoiceEmail,
  sendPaymentReminderEmail,
  sendReminderEmail,
  sendPaymentConfirmationEmail,
  renderReminderEmail,
} from "./email";

describe("Email Module", () => {
  const mockUser = {
    id: 1,
    name: "Test User",
    email: "user@example.com",
    companyName: "Test Company",
    companyAddress: "123 Test St",
    companyPhone: "555-1234",
    companyWebsite: "https://test.com",
    companyLogo: null,
    openId: "test-open-id",
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeCustomerId: null,
    subscriptionStatus: "free" as const,
    subscriptionId: null,
    currentPeriodEnd: null,
    subscriptionEndDate: null,
    subscriptionSource: null,
  };

  const mockClient = {
    id: 1,
    userId: 1,
    name: "Test Client",
    email: "client@example.com",
    company: "Client Company",
    address: "456 Client Ave",
    phone: "555-5678",
    notes: null,
    accessToken: "test-token",
    accessTokenExpiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInvoice = {
    id: 1,
    userId: 1,
    clientId: 1,
    invoiceNumber: "INV-0001",
    status: "sent" as const,
    currency: "USD",
    subtotal: "100.00",
    taxRate: "0",
    taxAmount: "0",
    discountType: "percentage" as const,
    discountValue: "0",
    discountAmount: "0",
    total: "100.00",
    amountPaid: "0",
    cryptoAmount: null,
    cryptoCurrency: null,
    cryptoPaymentId: null,
    cryptoPaymentUrl: null,
    stripePaymentLinkId: null,
    stripePaymentLinkUrl: null,
    stripeSessionId: null,
    notes: "Test notes",
    paymentTerms: "Net 30",
    templateId: null,
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 86400000),
    sentAt: null,
    paidAt: null,
    firstViewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "test-email-id" }, error: null });
    process.env.RESEND_API_KEY = "test-api-key";
    process.env.VITE_FRONTEND_FORGE_API_URL = "https://test.sleekinvoices.com";
  });

  describe("sendInvoiceEmail", () => {
    it("should fail if client email is not set", async () => {
      const clientWithoutEmail = { ...mockClient, email: "" };
      const result = await sendInvoiceEmail({
        invoice: mockInvoice,
        client: clientWithoutEmail,
        user: mockUser,
        pdfBuffer: Buffer.from("test"),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Client email is not set");
    });

    it("should fail if user email is not set", async () => {
      const userWithoutEmail = { ...mockUser, email: "" };
      const result = await sendInvoiceEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: userWithoutEmail,
        pdfBuffer: Buffer.from("test"),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("User email is not set");
    });

    it("should send email successfully with valid params", async () => {
      const result = await sendInvoiceEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        pdfBuffer: Buffer.from("test-pdf-content"),
        paymentLinkUrl: "https://stripe.com/pay/test",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("test-email-id");
      expect(mockSend).toHaveBeenCalled();
    });

    it("should include payment link when provided", async () => {
      await sendInvoiceEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        pdfBuffer: Buffer.from("test"),
        paymentLinkUrl: "https://stripe.com/pay/test",
      });

      expect(mockSend).toHaveBeenCalled();
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain("https://stripe.com/pay/test");
      expect(callArgs.html).toContain("Pay Invoice Online");
    });

    it("should attach PDF with correct filename", async () => {
      await sendInvoiceEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        pdfBuffer: Buffer.from("test"),
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.attachments).toHaveLength(1);
      expect(callArgs.attachments[0].filename).toBe("invoice-INV-0001.pdf");
    });

    it("should use correct from address format", async () => {
      await sendInvoiceEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        pdfBuffer: Buffer.from("test"),
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.from).toBe("Test User <invoices@sleekinvoices.com>");
      expect(callArgs.replyTo).toBe("user@example.com");
    });

    it("should generate valid HTML structure", async () => {
      await sendInvoiceEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        pdfBuffer: Buffer.from("test"),
      });

      const callArgs = mockSend.mock.calls[0][0];
      const html = callArgs.html;

      // Check for valid HTML structure
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html>");
      expect(html).toContain("</html>");
      expect(html).toContain("<head>");
      expect(html).toContain("<body>");

      // Check for required content
      expect(html).toContain(mockClient.name);
      expect(html).toContain(mockInvoice.invoiceNumber);
      expect(html).toContain("$100.00");
    });
  });

  describe("sendPaymentReminderEmail", () => {
    it("should fail if client email is not set", async () => {
      const clientWithoutEmail = { ...mockClient, email: "" };
      const result = await sendPaymentReminderEmail({
        invoice: mockInvoice,
        client: clientWithoutEmail,
        user: mockUser,
        pdfBuffer: Buffer.from("test"),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Client email is not set");
    });

    it("should send reminder email successfully", async () => {
      const result = await sendPaymentReminderEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        pdfBuffer: Buffer.from("test"),
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    it("should use different subject for overdue invoices", async () => {
      const overdueInvoice = { ...mockInvoice, status: "overdue" as const };
      await sendPaymentReminderEmail({
        invoice: overdueInvoice,
        client: mockClient,
        user: mockUser,
        pdfBuffer: Buffer.from("test"),
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.subject).toContain("Overdue");
    });
  });

  describe("sendReminderEmail", () => {
    it("should fail if client email is not set", async () => {
      const clientWithoutEmail = { ...mockClient, email: "" };
      const result = await sendReminderEmail({
        invoice: mockInvoice,
        client: clientWithoutEmail,
        user: mockUser,
        daysOverdue: 5,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Client email is not set");
    });

    it("should send reminder with correct days overdue", async () => {
      await sendReminderEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        daysOverdue: 7,
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.subject).toContain("7 days overdue");
    });

    it("should support CC email", async () => {
      await sendReminderEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        daysOverdue: 5,
        ccEmail: "cc@example.com",
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.cc).toBe("cc@example.com");
    });
  });

  describe("sendPaymentConfirmationEmail", () => {
    it("should fail if client email is not set", async () => {
      const clientWithoutEmail = { ...mockClient, email: "" };
      const result = await sendPaymentConfirmationEmail({
        invoice: mockInvoice,
        client: clientWithoutEmail,
        user: mockUser,
        amountPaid: 100,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Client email is not set");
    });

    it("should send confirmation email successfully", async () => {
      const result = await sendPaymentConfirmationEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        amountPaid: 100,
        paymentMethod: "Stripe",
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    it("should include correct payment details", async () => {
      await sendPaymentConfirmationEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        amountPaid: 75.5,
        paymentMethod: "Crypto",
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain("$75.50");
      expect(callArgs.html).toContain("Crypto");
      expect(callArgs.subject).toBe("Payment Received for Invoice INV-0001");
    });
  });

  describe("renderReminderEmail", () => {
    it("should replace all placeholders correctly", () => {
      const template = `
        Hello {{clientName}},
        Invoice {{invoiceNumber}} for {{invoiceAmount}} was due on {{dueDate}}.
        It is now {{daysOverdue}} days overdue.
        View at: {{invoiceUrl}}
        From: {{companyName}}
      `;

      const rendered = renderReminderEmail({
        template,
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        daysOverdue: 10,
        invoiceUrl: "https://test.com/invoice/1",
      });

      expect(rendered).toContain("Test Client");
      expect(rendered).toContain("INV-0001");
      expect(rendered).toContain("$100.00");
      expect(rendered).toContain("10 days overdue");
      expect(rendered).toContain("https://test.com/invoice/1");
      expect(rendered).toContain("Test Company");
    });

    it("should handle missing client name gracefully", () => {
      const template = "Hello {{clientName}}";
      const clientWithoutName = { ...mockClient, name: "" };

      const rendered = renderReminderEmail({
        template,
        invoice: mockInvoice,
        client: clientWithoutName,
        user: mockUser,
        daysOverdue: 5,
        invoiceUrl: "https://test.com",
      });

      expect(rendered).toContain("Valued Customer");
    });
  });

  describe("Error Handling", () => {
    it("should handle Resend API errors gracefully", async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { message: "Rate limit exceeded" },
      });

      const result = await sendInvoiceEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        pdfBuffer: Buffer.from("test"),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Rate limit exceeded");
    });

    it("should handle network errors", async () => {
      mockSend.mockRejectedValueOnce(new Error("Network error"));

      const result = await sendInvoiceEmail({
        invoice: mockInvoice,
        client: mockClient,
        user: mockUser,
        pdfBuffer: Buffer.from("test"),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });
});

describe("Portal Invitation Email", () => {
  it("should generate correct email content", async () => {
    const { generatePortalInvitationEmail } = await import(
      "./email-templates/portal-invitation"
    );

    const result = generatePortalInvitationEmail({
      clientName: "John Doe",
      portalUrl: "https://test.com/portal/abc123",
      companyName: "Acme Corp",
      expiresInDays: 30,
    });

    expect(result.subject).toBe("Access Your Invoices - Acme Corp");
    expect(result.html).toContain("John Doe");
    expect(result.html).toContain("https://test.com/portal/abc123");
    expect(result.html).toContain("Acme Corp");
    expect(result.html).toContain("30 days");
  });

  it("should use default company name if not provided", async () => {
    const { generatePortalInvitationEmail } = await import(
      "./email-templates/portal-invitation"
    );

    const result = generatePortalInvitationEmail({
      clientName: "Jane Doe",
      portalUrl: "https://test.com/portal/xyz",
      expiresInDays: 7,
    });

    expect(result.subject).toBe("Access Your Invoices - SleekInvoices");
    expect(result.html).toContain("SleekInvoices");
  });
});
