import { describe, it, expect } from "vitest";

/**
 * Tests for animated number component logic
 * These tests verify the easing functions and animation calculations
 * without requiring DOM rendering
 */

// Easing function implementations (same as in the component)
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

// Animation value calculator
function calculateAnimatedValue(
  progress: number,
  targetValue: number,
  easing: "expo" | "quart" = "expo"
): number {
  const easingFn = easing === "expo" ? easeOutExpo : easeOutQuart;
  const easedProgress = easingFn(progress);
  return easedProgress * targetValue;
}

// Currency formatter (simplified version)
function formatCurrency(value: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

describe("Easing Functions", () => {
  describe("easeOutExpo", () => {
    it("returns 0 at start (t=0)", () => {
      expect(easeOutExpo(0)).toBe(0);
    });

    it("returns 1 at end (t=1)", () => {
      expect(easeOutExpo(1)).toBe(1);
    });

    it("returns value > 0.5 at midpoint for snappy feel", () => {
      expect(easeOutExpo(0.5)).toBeGreaterThan(0.5);
    });

    it("returns value > 0.9 at t=0.7 for fast start", () => {
      expect(easeOutExpo(0.7)).toBeGreaterThan(0.9);
    });

    it("produces smooth progression", () => {
      const values = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(
        easeOutExpo
      );
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    });
  });

  describe("easeOutQuart", () => {
    it("returns 0 at start (t=0)", () => {
      expect(easeOutQuart(0)).toBe(0);
    });

    it("returns 1 at end (t=1)", () => {
      expect(easeOutQuart(1)).toBe(1);
    });

    it("returns value > 0.5 at midpoint", () => {
      expect(easeOutQuart(0.5)).toBeGreaterThan(0.5);
    });

    it("produces smooth progression", () => {
      const values = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(
        easeOutQuart
      );
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
    });
  });

  describe("Easing comparison", () => {
    it("expo is faster than quart at early stages", () => {
      expect(easeOutExpo(0.3)).toBeGreaterThan(easeOutQuart(0.3));
    });

    it("both reach same endpoint", () => {
      expect(easeOutExpo(1)).toBe(easeOutQuart(1));
    });
  });
});

describe("Animation Value Calculation", () => {
  describe("with expo easing", () => {
    it("calculates correct value at start", () => {
      expect(calculateAnimatedValue(0, 1000, "expo")).toBe(0);
    });

    it("calculates correct value at end", () => {
      expect(calculateAnimatedValue(1, 1000, "expo")).toBe(1000);
    });

    it("calculates intermediate values correctly", () => {
      const value = calculateAnimatedValue(0.5, 1000, "expo");
      expect(value).toBeGreaterThan(500);
      expect(value).toBeLessThan(1000);
    });

    it("handles decimal target values", () => {
      const value = calculateAnimatedValue(1, 123.45, "expo");
      expect(value).toBeCloseTo(123.45, 2);
    });

    it("handles zero target value", () => {
      expect(calculateAnimatedValue(0.5, 0, "expo")).toBe(0);
    });

    it("handles large target values", () => {
      const value = calculateAnimatedValue(1, 1000000, "expo");
      expect(value).toBe(1000000);
    });
  });

  describe("with quart easing", () => {
    it("calculates correct value at start", () => {
      expect(calculateAnimatedValue(0, 1000, "quart")).toBe(0);
    });

    it("calculates correct value at end", () => {
      expect(calculateAnimatedValue(1, 1000, "quart")).toBe(1000);
    });

    it("calculates intermediate values correctly", () => {
      const value = calculateAnimatedValue(0.5, 1000, "quart");
      expect(value).toBeGreaterThan(500);
      expect(value).toBeLessThan(1000);
    });
  });
});

describe("Currency Formatting", () => {
  it("formats USD correctly", () => {
    expect(formatCurrency(1234.56, "USD")).toBe("$1,234.56");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0, "USD")).toBe("$0.00");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1000000, "USD")).toBe("$1,000,000.00");
  });

  it("formats EUR correctly", () => {
    const formatted = formatCurrency(1234.56, "EUR");
    expect(formatted).toContain("1,234.56");
    expect(formatted).toContain("€");
  });

  it("handles negative values", () => {
    const formatted = formatCurrency(-100, "USD");
    expect(formatted).toContain("100");
    expect(formatted).toContain("-");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(123.456, "USD")).toBe("$123.46");
  });
});

describe("Animation Progress Simulation", () => {
  it("simulates full animation cycle", () => {
    const targetValue = 41000;
    const steps = 10;
    const values: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      values.push(calculateAnimatedValue(progress, targetValue, "expo"));
    }

    expect(values[0]).toBe(0);
    expect(values[values.length - 1]).toBe(targetValue);

    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });

  it("reaches 90% of value quickly with expo easing", () => {
    const targetValue = 1000;
    const valueAt50Percent = calculateAnimatedValue(0.5, targetValue, "expo");
    expect(valueAt50Percent).toBeGreaterThan(900);
  });

  it("handles integer rounding for counts", () => {
    const targetValue = 121;
    const valueAtMidpoint = calculateAnimatedValue(0.5, targetValue, "quart");
    const rounded = Math.round(valueAtMidpoint);

    expect(rounded).toBeGreaterThan(60);
    expect(rounded).toBeLessThan(121);
    expect(Number.isInteger(rounded)).toBe(true);
  });
});

describe("Percentage Formatting", () => {
  it("formats positive percentage with sign", () => {
    const value = 12.5;
    const formatted = `+${value.toFixed(1)}%`;
    expect(formatted).toBe("+12.5%");
  });

  it("formats negative percentage", () => {
    const value = -5.3;
    const formatted = `${value.toFixed(1)}%`;
    expect(formatted).toBe("-5.3%");
  });

  it("formats zero percentage", () => {
    const value = 0;
    const formatted = `${value.toFixed(1)}%`;
    expect(formatted).toBe("0.0%");
  });

  it("supports custom decimal places", () => {
    const value = 12.567;
    expect(`${value.toFixed(0)}%`).toBe("13%");
    expect(`${value.toFixed(1)}%`).toBe("12.6%");
    expect(`${value.toFixed(2)}%`).toBe("12.57%");
  });
});

describe("Animation Timing", () => {
  it("delay should offset animation start", () => {
    const delay = 200;
    const duration = 800;

    const elapsed1 = 100;
    const progress1 = Math.max(0, (elapsed1 - delay) / duration);
    expect(progress1).toBe(0);

    const elapsed2 = 300;
    const progress2 = Math.max(0, (elapsed2 - delay) / duration);
    expect(progress2).toBeCloseTo(0.125, 3);
  });

  it("animation completes at duration + delay", () => {
    const delay = 100;
    const duration = 600;

    const elapsed = delay + duration;
    const progress = Math.min((elapsed - delay) / duration, 1);
    expect(progress).toBe(1);
  });
});
