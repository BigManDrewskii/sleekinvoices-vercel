import { invokeLLM } from "../_core/llm";
import { logAiUsage, useAiCredit, hasAiCredits } from "../db";

export interface ExtractedInvoiceData {
  clientName?: string;
  clientEmail?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
  }>;
  dueDate?: string; // ISO date string
  notes?: string;
  currency?: string;
}

export interface SmartComposeResult {
  success: boolean;
  data?: ExtractedInvoiceData;
  error?: string;
  creditsRemaining?: number;
}

/**
 * Extract invoice data from natural language input
 *
 * @example
 * Input: "Invoice Acme Corp for website redesign, $5000, due in 2 weeks"
 * Output: {
 *   clientName: "Acme Corp",
 *   lineItems: [{ description: "Website Redesign", quantity: 1, rate: 5000 }],
 *   dueDate: "2026-01-21"
 * }
 */
export async function extractInvoiceData(
  input: string,
  userId: number,
  isPro: boolean = false,
  existingClients: Array<{ id: number; name: string; email?: string }> = []
): Promise<SmartComposeResult> {
  const startTime = Date.now();

  // Check if user has credits
  const hasCredits = await hasAiCredits(userId, isPro);
  if (!hasCredits) {
    return {
      success: false,
      error: isPro
        ? "You've used all 50 AI credits this month. Credits reset on the 1st."
        : "You've used all 5 free AI credits this month. Upgrade to Pro for 50 credits/month.",
    };
  }

  // Build client context for better matching
  const clientContext =
    existingClients.length > 0
      ? `\n\nExisting clients (match if similar):\n${existingClients.map(c => `- ${c.name}${c.email ? ` (${c.email})` : ""}`).join("\n")}`
      : "";

  const today = new Date();
  const systemPrompt = `You are an invoice data extraction assistant. Extract structured invoice data from natural language input.

Today's date: ${today.toISOString().split("T")[0]}

Rules:
1. Extract client name, line items (description, quantity, rate), due date, and any notes
2. If a due date is mentioned relatively (e.g., "in 2 weeks", "next month", "net 30"), calculate the actual date
3. Default quantity to 1 if not specified
4. Parse currency from symbols ($, €, £) or codes (USD, EUR, GBP)
5. If client name matches an existing client, use the exact name from the list
6. Be generous in interpretation - extract as much useful data as possible
7. For multiple items, split them into separate line items${clientContext}

Respond ONLY with valid JSON matching this schema:
{
  "clientName": "string or null",
  "clientEmail": "string or null", 
  "lineItems": [{"description": "string", "quantity": number, "rate": number}],
  "dueDate": "YYYY-MM-DD or null",
  "notes": "string or null",
  "currency": "USD/EUR/GBP/etc or null"
}`;

  try {
    console.log("[SmartCompose] Processing input:", input.substring(0, 100));
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "invoice_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              clientName: {
                type: "string",
                description: "Client name or empty string if not found",
              },
              clientEmail: {
                type: "string",
                description: "Client email or empty string if not found",
              },
              lineItems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    quantity: { type: "number" },
                    rate: { type: "number" },
                  },
                  required: ["description", "quantity", "rate"],
                  additionalProperties: false,
                },
              },
              dueDate: {
                type: "string",
                description: "Due date in YYYY-MM-DD format or empty string",
              },
              notes: {
                type: "string",
                description: "Additional notes or empty string",
              },
              currency: {
                type: "string",
                description: "Currency code like USD, EUR, GBP or empty string",
              },
            },
            required: [
              "clientName",
              "clientEmail",
              "lineItems",
              "dueDate",
              "notes",
              "currency",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const latencyMs = Date.now() - startTime;
    console.log(
      "[SmartCompose] Response received:",
      JSON.stringify(response, null, 2).substring(0, 500)
    );

    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error("Invalid response structure from LLM");
    }

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response message");
    }

    // Handle case where content might be an array (multimodal response)
    const textContent =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.find(c => c.type === "text")?.text
          : null;

    if (!textContent) {
      throw new Error("No text content in response");
    }

    const parsed = JSON.parse(textContent) as ExtractedInvoiceData;

    // Use a credit
    await useAiCredit(userId, isPro);

    // Log usage
    await logAiUsage({
      userId,
      feature: "smart_compose",
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      model: response.model || "gemini-2.5-flash",
      success: true,
      latencyMs,
    });

    return {
      success: true,
      data: {
        clientName: parsed.clientName || undefined,
        clientEmail: parsed.clientEmail || undefined,
        lineItems: parsed.lineItems || [],
        dueDate: parsed.dueDate || undefined,
        notes: parsed.notes || undefined,
        currency: parsed.currency || undefined,
      },
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[SmartCompose] Error:", errorMessage, error);

    // Log failed attempt (don't consume credit on failure)
    await logAiUsage({
      userId,
      feature: "smart_compose",
      inputTokens: 0,
      outputTokens: 0,
      model: "gemini-2.5-flash",
      success: false,
      errorMessage,
      latencyMs,
    });

    return {
      success: false,
      error:
        "Failed to extract invoice data. Please try again or enter details manually.",
    };
  }
}

/**
 * Suggest line items based on description
 * Uses historical data to provide intelligent suggestions
 */
export async function suggestLineItems(
  partialDescription: string,
  userId: number,
  recentLineItems: Array<{ description: string; rate: number }> = []
): Promise<Array<{ description: string; rate: number }>> {
  // Simple fuzzy matching against recent items
  // This doesn't use AI credits - it's a local operation
  const normalizedInput = partialDescription.toLowerCase().trim();

  if (!normalizedInput || normalizedInput.length < 2) {
    return [];
  }

  const matches = recentLineItems
    .filter(
      item =>
        item.description.toLowerCase().includes(normalizedInput) ||
        normalizedInput
          .split(" ")
          .some(word => item.description.toLowerCase().includes(word))
    )
    .slice(0, 5);

  return matches;
}
