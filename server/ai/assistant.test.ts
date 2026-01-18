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

import { chatWithAssistant } from "./assistant";
import { invokeLLM } from "../_core/llm";
import { hasAiCredits, useAiCredit, logAiUsage } from "../db";

describe("AI Assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("chatWithAssistant", () => {
    it("should return error when user has no credits", async () => {
      vi.mocked(hasAiCredits).mockResolvedValue(false);

      const result = await chatWithAssistant("Hello", 1, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("credits");
      expect(invokeLLM).not.toHaveBeenCalled();
    });

    it("should return different error message for Pro users without credits", async () => {
      vi.mocked(hasAiCredits).mockResolvedValue(false);

      const result = await chatWithAssistant("Hello", 1, true);

      expect(result.success).toBe(false);
      expect(result.error).toContain("50 AI credits");
      expect(result.error).toContain("reset on the 1st");
    });

    it("should successfully process a chat message", async () => {
      vi.mocked(hasAiCredits).mockResolvedValue(true);
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [
          {
            message: {
              content: "Here is your revenue summary...",
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
        },
        model: "gemini-2.5-flash",
      });
      vi.mocked(useAiCredit).mockResolvedValue(undefined);
      vi.mocked(logAiUsage).mockResolvedValue(undefined);

      const result = await chatWithAssistant("What is my revenue?", 1, true);

      expect(result.success).toBe(true);
      expect(result.content).toBe("Here is your revenue summary...");
      expect(useAiCredit).toHaveBeenCalledWith(1, true);
      expect(logAiUsage).toHaveBeenCalled();
    });

    it("should include conversation history in LLM call", async () => {
      vi.mocked(hasAiCredits).mockResolvedValue(true);
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [
          {
            message: {
              content: "Based on our previous conversation...",
            },
          },
        ],
        usage: { prompt_tokens: 150, completion_tokens: 75 },
        model: "gemini-2.5-flash",
      });

      const context = {
        conversationHistory: [
          { role: "user" as const, content: "Hello" },
          { role: "assistant" as const, content: "Hi there!" },
        ],
      };

      await chatWithAssistant("Tell me more", 1, true, context);

      expect(invokeLLM).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "user", content: "Hello" }),
            expect.objectContaining({
              role: "assistant",
              content: "Hi there!",
            }),
            expect.objectContaining({ role: "user", content: "Tell me more" }),
          ]),
        })
      );
    });

    it("should include page context in system prompt", async () => {
      vi.mocked(hasAiCredits).mockResolvedValue(true);
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [
          {
            message: { content: "Response" },
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
        model: "gemini-2.5-flash",
      });

      const context = {
        currentPage: "/dashboard",
      };

      await chatWithAssistant("Help me", 1, true, context);

      expect(invokeLLM).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "system",
              content: expect.stringContaining("Dashboard"),
            }),
          ]),
        })
      );
    });

    it("should include business stats in system prompt when provided", async () => {
      vi.mocked(hasAiCredits).mockResolvedValue(true);
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [
          {
            message: { content: "Your revenue is great!" },
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
        model: "gemini-2.5-flash",
      });

      const context = {
        stats: {
          totalRevenue: 50000,
          outstandingBalance: 10000,
          totalInvoices: 25,
          paidInvoices: 20,
        },
      };

      await chatWithAssistant("How is my business doing?", 1, true, context);

      expect(invokeLLM).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "system",
              content: expect.stringContaining("50,000"),
            }),
          ]),
        })
      );
    });

    it("should handle LLM errors gracefully", async () => {
      vi.mocked(hasAiCredits).mockResolvedValue(true);
      vi.mocked(invokeLLM).mockRejectedValue(new Error("API error"));
      vi.mocked(logAiUsage).mockResolvedValue(undefined);

      const result = await chatWithAssistant("Hello", 1, true);

      expect(result.success).toBe(false);
      expect(result.error).toContain("error");
      expect(logAiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorMessage: "API error",
        })
      );
    });

    it("should handle empty LLM response", async () => {
      vi.mocked(hasAiCredits).mockResolvedValue(true);
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [],
        usage: { prompt_tokens: 100, completion_tokens: 0 },
        model: "gemini-2.5-flash",
      });
      vi.mocked(logAiUsage).mockResolvedValue(undefined);

      const result = await chatWithAssistant("Hello", 1, true);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should limit conversation history to last 10 messages", async () => {
      vi.mocked(hasAiCredits).mockResolvedValue(true);
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [
          {
            message: { content: "Response" },
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
        model: "gemini-2.5-flash",
      });

      // Create 15 messages
      const conversationHistory = Array.from({ length: 15 }, (_, i) => ({
        role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
        content: `Message ${i}`,
      }));

      await chatWithAssistant("New message", 1, true, { conversationHistory });

      const call = vi.mocked(invokeLLM).mock.calls[0][0];
      // Should have: 1 system + 10 history + 1 current = 12 messages
      expect(call.messages.length).toBe(12);
    });
  });
});
