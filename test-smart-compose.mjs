import "dotenv/config";

async function test() {
  const url = process.env.BUILT_IN_FORGE_API_URL || "https://forge.manus.im";
  const key = process.env.BUILT_IN_FORGE_API_KEY;

  console.log("Testing Smart Compose with URL:", url);

  const systemPrompt = `You are an invoice data extraction assistant. Extract structured invoice data from natural language input.

Today's date: 2026-01-07

Rules:
1. Extract client name, line items (description, quantity, rate), due date, and any notes
2. If a due date is mentioned relatively (e.g., "in 2 weeks", "next month", "net 30"), calculate the actual date
3. Default quantity to 1 if not specified
4. Parse currency from symbols ($, €, £) or codes (USD, EUR, GBP)
5. Be generous in interpretation - extract as much useful data as possible

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
    const response = await fetch(url + "/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Invoice TechCorp for 5 hours of web development at $150/hour, due in 2 weeks",
          },
        ],
        max_tokens: 1000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "invoice_extraction",
            strict: true,
            schema: {
              type: "object",
              properties: {
                clientName: { type: ["string", "null"] },
                clientEmail: { type: ["string", "null"] },
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
                dueDate: { type: ["string", "null"] },
                notes: { type: ["string", "null"] },
                currency: { type: ["string", "null"] },
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
      }),
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
