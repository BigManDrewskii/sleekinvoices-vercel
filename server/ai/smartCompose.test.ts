import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock the db module
vi.mock("../db", () => ({
  hasAiCredits: vi.fn(),
  useAiCredit: vi.fn(),
  logAiUsage: vi.fn(),
}));

import { extractInvoiceData } from "./smartCompose";
import { invokeLLM } from "../_core/llm";
import { hasAiCredits, useAiCredit, logAiUsage } from "../db";

describe("Smart Compose - Invoice Extraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract invoice data from natural language input", async () => {
    // Setup mocks
    vi.mocked(hasAiCredits).mockResolvedValue(true);
    vi.mocked(useAiCredit).mockResolvedValue(true);
    vi.mocked(logAiUsage).mockResolvedValue(undefined);
    vi.mocked(invokeLLM).mockResolvedValue({
      id: "test-id",
      created: Date.now(),
      model: "gemini-2.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              clientName: "John",
              clientEmail: null,
              lineItems: [
                { description: "Consulting", quantity: 10, rate: 150 },
              ],
              dueDate: null,
              notes: null,
              currency: "USD",
            }),
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    });

    const result = await extractInvoiceData(
      "Invoice John for 10 hours of consulting at $150/hr",
      1,
      false,
      []
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.clientName).toBe("John");
    expect(result.data?.lineItems).toHaveLength(1);
    expect(result.data?.lineItems[0].description).toBe("Consulting");
    expect(result.data?.lineItems[0].quantity).toBe(10);
    expect(result.data?.lineItems[0].rate).toBe(150);
  });

  it("should return error when user has no credits", async () => {
    vi.mocked(hasAiCredits).mockResolvedValue(false);

    const result = await extractInvoiceData(
      "Invoice John for consulting",
      1,
      false,
      []
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("credits");
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it("should show different error message for Pro users without credits", async () => {
    vi.mocked(hasAiCredits).mockResolvedValue(false);

    const result = await extractInvoiceData(
      "Invoice John for consulting",
      1,
      true, // isPro
      []
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("50 AI credits");
    expect(result.error).toContain("reset on the 1st");
  });

  it("should match existing clients when provided", async () => {
    vi.mocked(hasAiCredits).mockResolvedValue(true);
    vi.mocked(useAiCredit).mockResolvedValue(true);
    vi.mocked(logAiUsage).mockResolvedValue(undefined);
    vi.mocked(invokeLLM).mockResolvedValue({
      id: "test-id",
      created: Date.now(),
      model: "gemini-2.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              clientName: "Acme Corporation",
              clientEmail: "billing@acme.com",
              lineItems: [
                { description: "Website Redesign", quantity: 1, rate: 5000 },
              ],
              dueDate: "2026-01-21",
              notes: null,
              currency: "USD",
            }),
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    });

    const existingClients = [
      { id: 1, name: "Acme Corporation", email: "billing@acme.com" },
      { id: 2, name: "Tech Startup Inc", email: "hello@techstartup.com" },
    ];

    const result = await extractInvoiceData(
      "Invoice Acme for website redesign, $5000, due in 2 weeks",
      1,
      false,
      existingClients
    );

    expect(result.success).toBe(true);
    expect(result.data?.clientName).toBe("Acme Corporation");
    expect(result.data?.clientEmail).toBe("billing@acme.com");

    // Verify the LLM was called with client context
    expect(invokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "system",
            content: expect.stringContaining("Acme Corporation"),
          }),
        ]),
      })
    );
  });

  it("should handle LLM errors gracefully", async () => {
    vi.mocked(hasAiCredits).mockResolvedValue(true);
    vi.mocked(logAiUsage).mockResolvedValue(undefined);
    vi.mocked(invokeLLM).mockRejectedValue(
      new Error("API rate limit exceeded")
    );

    const result = await extractInvoiceData(
      "Invoice John for consulting",
      1,
      false,
      []
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Failed to extract invoice data. Please try again or enter details manually."
    );

    // Should not consume credit on failure
    expect(useAiCredit).not.toHaveBeenCalled();

    // Should log the failure
    expect(logAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errorMessage: "API rate limit exceeded",
      })
    );
  });

  it("should handle malformed LLM response", async () => {
    vi.mocked(hasAiCredits).mockResolvedValue(true);
    vi.mocked(logAiUsage).mockResolvedValue(undefined);
    vi.mocked(invokeLLM).mockResolvedValue({
      id: "test-id",
      created: Date.now(),
      model: "gemini-2.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "This is not valid JSON",
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    });

    const result = await extractInvoiceData(
      "Invoice John for consulting",
      1,
      false,
      []
    );

    expect(result.success).toBe(false);
    expect(useAiCredit).not.toHaveBeenCalled();
  });

  it("should extract multiple line items", async () => {
    vi.mocked(hasAiCredits).mockResolvedValue(true);
    vi.mocked(useAiCredit).mockResolvedValue(true);
    vi.mocked(logAiUsage).mockResolvedValue(undefined);
    vi.mocked(invokeLLM).mockResolvedValue({
      id: "test-id",
      created: Date.now(),
      model: "gemini-2.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              clientName: "Tech Startup Inc",
              clientEmail: null,
              lineItems: [
                { description: "Homepage", quantity: 1, rate: 800 },
                { description: "About Page", quantity: 1, rate: 800 },
                { description: "Contact Page", quantity: 1, rate: 800 },
              ],
              dueDate: null,
              notes: null,
              currency: "USD",
            }),
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 80, total_tokens: 180 },
    });

    const result = await extractInvoiceData(
      "3 website pages at $800 each for Tech Startup Inc",
      1,
      false,
      []
    );

    expect(result.success).toBe(true);
    expect(result.data?.lineItems).toHaveLength(3);
    expect(
      result.data?.lineItems.reduce(
        (sum, item) => sum + item.rate * item.quantity,
        0
      )
    ).toBe(2400);
  });
});
