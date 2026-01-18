import { invokeLLM } from "../_core/llm";
import { logAiUsage, useAiCredit, hasAiCredits } from "../db";

interface ChatContext {
  currentPage?: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  stats?: {
    totalRevenue?: number;
    outstandingBalance?: number;
    totalInvoices?: number;
    paidInvoices?: number;
  };
}

interface ChatResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * AI Assistant for conversational help with invoicing tasks
 */
export async function chatWithAssistant(
  message: string,
  userId: number,
  isPro: boolean = false,
  context?: ChatContext
): Promise<ChatResult> {
  const startTime = Date.now();

  // Check if user has credits
  const hasCredits = await hasAiCredits(userId, isPro);
  if (!hasCredits) {
    return {
      success: false,
      content: "",
      error: isPro
        ? "You've used all 50 AI credits this month. Credits reset on the 1st."
        : "You've used all 5 free AI credits this month. Upgrade to Pro for 50 credits/month.",
    };
  }

  // Build context-aware system prompt
  const systemPrompt = buildSystemPrompt(context);

  // Build messages array with conversation history
  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [{ role: "system", content: systemPrompt }];

  // Add conversation history (last 10 messages for context)
  if (context?.conversationHistory) {
    const recentHistory = context.conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Add the current message
  messages.push({ role: "user", content: message });

  try {
    console.log("[AIAssistant] Processing message:", message.substring(0, 100));

    const response = await invokeLLM({
      messages,
    });

    const latencyMs = Date.now() - startTime;

    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error("Invalid response structure from LLM");
    }

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response message");
    }

    // Handle case where content might be an array
    const textContent =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.find(c => c.type === "text")?.text
          : null;

    if (!textContent) {
      throw new Error("No text content in response");
    }

    // Use a credit
    await useAiCredit(userId, isPro);

    // Log usage
    await logAiUsage({
      userId,
      feature: "ai_assistant",
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      model: response.model || "gemini-2.5-flash",
      success: true,
      latencyMs,
    });

    return {
      success: true,
      content: textContent,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[AIAssistant] Error:", errorMessage, error);

    // Log failed attempt
    await logAiUsage({
      userId,
      feature: "ai_assistant",
      inputTokens: 0,
      outputTokens: 0,
      model: "gemini-2.5-flash",
      success: false,
      errorMessage,
      latencyMs,
    });

    return {
      success: false,
      content: "",
      error:
        "I encountered an error processing your request. Please try again.",
    };
  }
}

/**
 * Build a context-aware system prompt
 */
function buildSystemPrompt(context?: ChatContext): string {
  const today = new Date().toISOString().split("T")[0];

  let prompt = `You are a helpful AI assistant for SleekInvoices, a professional invoicing platform. Today's date is ${today}.

Your role is to help users with:
- Creating and managing invoices
- Understanding their business finances
- Providing insights about clients and revenue
- Drafting professional emails for invoice follow-ups
- Answering questions about invoicing best practices

Guidelines:
- Be concise and helpful
- Use a friendly, professional tone
- Format responses with markdown when helpful (lists, bold for emphasis)
- Provide actionable advice, not just information

## Action Buttons
You can include clickable action buttons in your responses using this format:
[[action:TYPE|LABEL|DATA]]

Available action types:
- create_invoice: Opens new invoice form. Data: {"clientName":"Name"} or {"clientId":123}
- view_invoice: Opens an invoice. Data: {"invoiceId":123}
- view_client: Opens client details. Data: {"clientId":123}
- send_reminder: Sends payment reminder. Data: {"invoiceId":123}
- create_client: Opens new client form. No data needed.
- view_analytics: Opens analytics page. No data needed.
- navigate: Navigate to a page. Data: {"path":"/page"}
- copy_text: Copy text to clipboard. Data: {"text":"content to copy"}

Examples:
- "I can help you create an invoice for this client. [[action:create_invoice|Create Invoice|{"clientName":"Acme Corp"}]]"
- "Here's a follow-up email you can send: [email text]... [[action:copy_text|Copy Email|{"text":"Dear Client..."}]]"
- "You have 3 overdue invoices. [[action:navigate|View Overdue Invoices|{"path":"/invoices?status=overdue"}]]"

IMPORTANT:
- Only include action buttons when they provide clear value
- Place action buttons at the end of your response, after your explanation
- Use 1-3 action buttons maximum per response
- Make button labels short and action-oriented (e.g., "Create Invoice", "Send Reminder")`;

  // Add page context
  if (context?.currentPage) {
    const pageContextMap: Record<string, string> = {
      "/dashboard":
        "The user is on the Dashboard, which shows an overview of their invoicing activity.",
      "/invoices": "The user is viewing their Invoices list.",
      "/invoices/new": "The user is creating a new invoice.",
      "/clients": "The user is managing their Clients.",
      "/analytics": "The user is viewing Analytics and reports.",
      "/expenses": "The user is managing Expenses.",
      "/settings": "The user is in Settings.",
    };

    const pageContext =
      pageContextMap[context.currentPage] ||
      `The user is on the ${context.currentPage} page.`;

    prompt += `\n\nCurrent context: ${pageContext}`;
  }

  // Add business stats if available
  if (context?.stats) {
    const { totalRevenue, outstandingBalance, totalInvoices, paidInvoices } =
      context.stats;

    prompt += `\n\nUser's business snapshot:`;
    if (totalRevenue !== undefined) {
      prompt += `\n- Total revenue: $${totalRevenue.toLocaleString()}`;
    }
    if (outstandingBalance !== undefined) {
      prompt += `\n- Outstanding balance: $${outstandingBalance.toLocaleString()}`;
    }
    if (totalInvoices !== undefined) {
      prompt += `\n- Total invoices: ${totalInvoices}`;
    }
    if (paidInvoices !== undefined) {
      prompt += `\n- Paid invoices: ${paidInvoices}`;
    }
  }

  return prompt;
}
