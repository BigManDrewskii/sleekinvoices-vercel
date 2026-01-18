import { describe, it, expect } from "vitest";

describe("NOWPayments API Credentials Validation", () => {
  it("should have NOWPAYMENTS_API_KEY environment variable set", () => {
    expect(process.env.NOWPAYMENTS_API_KEY).toBeDefined();
    expect(process.env.NOWPAYMENTS_API_KEY).not.toBe("");
  });

  it("should have NOWPAYMENTS_PUBLIC_KEY environment variable set", () => {
    expect(process.env.NOWPAYMENTS_PUBLIC_KEY).toBeDefined();
    expect(process.env.NOWPAYMENTS_PUBLIC_KEY).not.toBe("");
  });

  it("should successfully call NOWPayments API status endpoint", async () => {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;

    const response = await fetch("https://api.nowpayments.io/v1/status", {
      method: "GET",
      headers: {
        "x-api-key": apiKey!,
      },
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.message).toBe("OK");
  });

  it("should successfully fetch available currencies", async () => {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;

    const response = await fetch("https://api.nowpayments.io/v1/currencies", {
      method: "GET",
      headers: {
        "x-api-key": apiKey!,
      },
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.currencies).toBeDefined();
    expect(Array.isArray(data.currencies)).toBe(true);
    expect(data.currencies.length).toBeGreaterThan(0);

    // Verify common currencies are available
    const currencies = data.currencies.map((c: string) => c.toLowerCase());
    expect(currencies).toContain("btc");
    expect(currencies).toContain("eth");
  });

  it("should get minimum payment amount for BTC", async () => {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;

    const response = await fetch(
      "https://api.nowpayments.io/v1/min-amount?currency_from=usd&currency_to=btc",
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey!,
        },
      }
    );

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.min_amount).toBeDefined();
    expect(typeof data.min_amount).toBe("number");
  });
});
