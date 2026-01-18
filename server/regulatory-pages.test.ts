import { describe, it, expect } from "vitest";

/**
 * Tests for regulatory pages content compliance
 * These tests verify that Privacy Policy, Terms of Service, and Refund Policy
 * contain required legal sections and disclosures
 */

// Read the actual page content for testing
import fs from "fs";
import path from "path";

const readPageContent = (filename: string): string => {
  const filePath = path.join(
    __dirname,
    "..",
    "client",
    "src",
    "pages",
    filename
  );
  return fs.readFileSync(filePath, "utf-8");
};

describe("Privacy Policy Page", () => {
  const content = readPageContent("Privacy.tsx");

  it("should have a last updated date", () => {
    expect(content).toMatch(/Last updated:/i);
    expect(content).toMatch(/January 12, 2026/);
  });

  it("should disclose data collection practices", () => {
    expect(content).toMatch(/Information We Collect/i);
    expect(content).toMatch(/Account Information/i);
    expect(content).toMatch(/Business Information/i);
    expect(content).toMatch(/Client Data/i);
    expect(content).toMatch(/Invoice Data/i);
  });

  it("should include legal basis for processing (GDPR)", () => {
    expect(content).toMatch(/Legal Basis for Processing/i);
    expect(content).toMatch(/Contract Performance/i);
    expect(content).toMatch(/Legitimate Interests/i);
    expect(content).toMatch(/Consent/i);
  });

  it("should disclose Manus as platform provider", () => {
    expect(content).toMatch(/Manus/i);
    expect(content).toMatch(/Platform Provider/i);
    expect(content).toMatch(/infrastructure/i);
  });

  it("should list subprocessors/service providers", () => {
    expect(content).toMatch(/Service Providers/i);
    expect(content).toMatch(/Stripe/i);
    expect(content).toMatch(/Resend/i);
    expect(content).toMatch(/OpenRouter/i);
  });

  it("should include AI features disclosure", () => {
    expect(content).toMatch(/AI Features/i);
    expect(content).toMatch(/Sleeky AI/i);
    expect(content).toMatch(/Smart Compose/i);
    expect(content).toMatch(/Automated/i);
  });

  it("should include GDPR user rights", () => {
    expect(content).toMatch(/Rights Under GDPR/i);
    expect(content).toMatch(/Access/i);
    expect(content).toMatch(/Rectification/i);
    expect(content).toMatch(/Erasure/i);
    expect(content).toMatch(/Portability/i);
  });

  it("should include CCPA user rights", () => {
    expect(content).toMatch(/Rights Under CCPA/i);
    expect(content).toMatch(/Right to Know/i);
    expect(content).toMatch(/Right to Delete/i);
    expect(content).toMatch(/Right to Opt-Out/i);
  });

  it("should include Do Not Sell disclosure", () => {
    expect(content).toMatch(/Do Not Sell/i);
    expect(content).toMatch(/We do not sell your personal information/i);
  });

  it("should include data retention policy", () => {
    expect(content).toMatch(/Data Retention/i);
    expect(content).toMatch(/30 days/i);
    expect(content).toMatch(/90 days/i);
  });

  it("should include data security section", () => {
    expect(content).toMatch(/Data Security/i);
    expect(content).toMatch(/encryption/i);
    expect(content).toMatch(/HTTPS/i);
  });

  it("should include contact information", () => {
    expect(content).toMatch(/Contact Us/i);
    expect(content).toMatch(/privacy@sleekinvoices.com/i);
  });

  it("should link to Manus privacy policy", () => {
    expect(content).toMatch(/manus\.im\/privacy/i);
  });

  it("should include footer with legal page links", () => {
    expect(content).toMatch(/Terms of Service/i);
    expect(content).toMatch(/Privacy Policy/i);
    expect(content).toMatch(/Refund Policy/i);
  });
});

describe("Terms of Service Page", () => {
  const content = readPageContent("Terms.tsx");

  it("should have a last updated date", () => {
    expect(content).toMatch(/Last updated:/i);
    expect(content).toMatch(/January 12, 2026/);
  });

  it("should include acceptance of terms section", () => {
    expect(content).toMatch(/Acceptance of Terms/i);
  });

  it("should include eligibility/age requirement", () => {
    expect(content).toMatch(/Eligibility/i);
    expect(content).toMatch(/18 years/i);
  });

  it("should describe the service", () => {
    expect(content).toMatch(/Description of Service/i);
    expect(content).toMatch(/invoicing platform/i);
  });

  it("should include user account responsibilities", () => {
    expect(content).toMatch(/User Accounts/i);
    expect(content).toMatch(/confidentiality/i);
  });

  it("should include subscription and billing terms", () => {
    expect(content).toMatch(/Subscription and Billing/i);
    expect(content).toMatch(/Automatic Renewal/i);
    expect(content).toMatch(/Price Changes/i);
  });

  it("should include AI usage terms", () => {
    expect(content).toMatch(/AI Features/i);
    expect(content).toMatch(/Sleeky AI/i);
    expect(content).toMatch(/AI Credits/i);
  });

  it("should include acceptable use policy", () => {
    expect(content).toMatch(/Acceptable Use/i);
    expect(content).toMatch(/not to use the Service/i);
  });

  it("should include third-party integrations section", () => {
    expect(content).toMatch(/Third-Party Integrations/i);
    expect(content).toMatch(/QuickBooks/i);
  });

  it("should include intellectual property section", () => {
    expect(content).toMatch(/Intellectual Property/i);
  });

  it("should include disclaimer of warranties", () => {
    expect(content).toMatch(/Disclaimer of Warranties/i);
    expect(content).toMatch(/AS IS/i);
  });

  it("should include limitation of liability", () => {
    expect(content).toMatch(/Limitation of Liability/i);
  });

  it("should include indemnification clause", () => {
    expect(content).toMatch(/Indemnification/i);
    expect(content).toMatch(/indemnify, defend, and hold harmless/i);
  });

  it("should include termination section", () => {
    expect(content).toMatch(/Termination/i);
  });

  it("should include dispute resolution/arbitration", () => {
    expect(content).toMatch(/Dispute Resolution/i);
    expect(content).toMatch(/Binding Arbitration/i);
    expect(content).toMatch(/Class Action Waiver/i);
  });

  it("should include governing law", () => {
    expect(content).toMatch(/Governing Law/i);
    expect(content).toMatch(/Delaware/i);
  });

  it("should include force majeure clause", () => {
    expect(content).toMatch(/Force Majeure/i);
  });

  it("should include severability clause", () => {
    expect(content).toMatch(/Severability/i);
  });

  it("should include entire agreement clause", () => {
    expect(content).toMatch(/Entire Agreement/i);
  });

  it("should reference Privacy Policy", () => {
    expect(content).toMatch(/Privacy Policy/i);
    expect(content).toMatch(/href="\/privacy"/i);
  });

  it("should reference Refund Policy", () => {
    expect(content).toMatch(/Refund Policy/i);
    expect(content).toMatch(/href="\/refund-policy"/i);
  });

  it("should include contact information", () => {
    expect(content).toMatch(/Contact Us/i);
    expect(content).toMatch(/legal@sleekinvoices.com/i);
  });
});

describe("Refund Policy Page", () => {
  const content = readPageContent("RefundPolicy.tsx");

  it("should have a last updated date", () => {
    expect(content).toMatch(/Last updated:/i);
    expect(content).toMatch(/January 12, 2026/);
  });

  it("should include 30-day money-back guarantee", () => {
    expect(content).toMatch(/30-Day Money-Back Guarantee/i);
    expect(content).toMatch(/30 days/i);
  });

  it("should include pro-rated refund information", () => {
    expect(content).toMatch(/Pro-Rated Refunds/i);
    expect(content).toMatch(/Annual/i);
    expect(content).toMatch(/Monthly/i);
  });

  it("should include pro-rata calculation formula", () => {
    expect(content).toMatch(/Refund Amount/i);
    expect(content).toMatch(/Months Remaining/i);
  });

  it("should include one-time purchase policy", () => {
    expect(content).toMatch(/One-Time Purchases/i);
    expect(content).toMatch(/AI Credits/i);
    expect(content).toMatch(/non-refundable/i);
  });

  it("should include cryptocurrency refund terms", () => {
    expect(content).toMatch(/Cryptocurrency/i);
    expect(content).toMatch(/blockchain/i);
  });

  it("should include subscription cancellation terms", () => {
    expect(content).toMatch(/Subscription Cancellation/i);
    expect(content).toMatch(/retain full access/i);
    expect(content).toMatch(/90 days/i);
  });

  it("should include exceptions and limitations", () => {
    expect(content).toMatch(/Exceptions and Limitations/i);
    expect(content).toMatch(/Maximum Refund Cap/i);
    expect(content).toMatch(/three/i);
  });

  it("should include refund request process", () => {
    expect(content).toMatch(/How to Request a Refund/i);
    expect(content).toMatch(/Contact Support/i);
    expect(content).toMatch(/5-7 business days/i);
  });

  it("should include contact information", () => {
    expect(content).toMatch(/Contact Us/i);
    expect(content).toMatch(/support@sleekinvoices.com/i);
  });

  it("should have consistent navigation with other legal pages", () => {
    expect(content).toMatch(/href="\/terms"/i);
    expect(content).toMatch(/href="\/privacy"/i);
    expect(content).toMatch(/href="\/landing"/i);
  });

  it("should have consistent footer with other legal pages", () => {
    expect(content).toMatch(/Terms of Service/i);
    expect(content).toMatch(/Privacy Policy/i);
    expect(content).toMatch(/Refund Policy/i);
    expect(content).toMatch(/© 2026 SleekInvoices/i);
  });
});

describe("Cross-Page Consistency", () => {
  const privacyContent = readPageContent("Privacy.tsx");
  const termsContent = readPageContent("Terms.tsx");
  const refundContent = readPageContent("RefundPolicy.tsx");

  it("all pages should have consistent navigation structure", () => {
    // All pages should have the same nav structure
    const navPattern = /nav className="fixed top-4/;
    expect(privacyContent).toMatch(navPattern);
    expect(termsContent).toMatch(navPattern);
    expect(refundContent).toMatch(navPattern);
  });

  it("all pages should have consistent footer structure", () => {
    // All pages should have footer with legal links
    const footerPattern = /footer className="relative mt-16"/;
    expect(privacyContent).toMatch(footerPattern);
    expect(termsContent).toMatch(footerPattern);
    expect(refundContent).toMatch(footerPattern);
  });

  it("all pages should link to each other", () => {
    // Privacy links to Terms and Refund
    expect(privacyContent).toMatch(/href="\/terms"/i);
    expect(privacyContent).toMatch(/href="\/refund-policy"/i);

    // Terms links to Privacy and Refund
    expect(termsContent).toMatch(/href="\/privacy"/i);
    expect(termsContent).toMatch(/href="\/refund-policy"/i);

    // Refund links to Privacy and Terms
    expect(refundContent).toMatch(/href="\/privacy"/i);
    expect(refundContent).toMatch(/href="\/terms"/i);
  });

  it("all pages should have the same copyright year", () => {
    const copyrightPattern = /© 2026 SleekInvoices/;
    expect(privacyContent).toMatch(copyrightPattern);
    expect(termsContent).toMatch(copyrightPattern);
    expect(refundContent).toMatch(copyrightPattern);
  });

  it("all pages should use getLoginUrl for auth links", () => {
    const loginUrlPattern = /getLoginUrl\(\)/;
    expect(privacyContent).toMatch(loginUrlPattern);
    expect(termsContent).toMatch(loginUrlPattern);
    expect(refundContent).toMatch(loginUrlPattern);
  });
});
