import { describe, it, expect } from "vitest";
import {
  CRYPTO_SUBSCRIPTION_TIERS,
  getCryptoTierByMonths,
  getAllCryptoTiers,
  getCryptoPrice,
  getCryptoSavings,
  getCryptoSavingsPercent,
  isValidCryptoDuration,
  CARD_PRICE_PER_MONTH,
} from "../shared/subscription";

describe("Crypto Subscription Pricing", () => {
  describe("CRYPTO_SUBSCRIPTION_TIERS", () => {
    it("should have 4 tiers defined", () => {
      const tiers = Object.keys(CRYPTO_SUBSCRIPTION_TIERS);
      expect(tiers).toHaveLength(4);
      expect(tiers).toContain("MONTHLY");
      expect(tiers).toContain("QUARTERLY");
      expect(tiers).toContain("BIANNUAL");
      expect(tiers).toContain("ANNUAL");
    });

    it("should have correct monthly tier pricing", () => {
      const tier = CRYPTO_SUBSCRIPTION_TIERS.MONTHLY;
      expect(tier.months).toBe(1);
      expect(tier.pricePerMonth).toBe(10.0);
      expect(tier.totalPrice).toBe(10.0);
      expect(tier.savingsPercent).toBe(17);
    });

    it("should have correct quarterly tier pricing", () => {
      const tier = CRYPTO_SUBSCRIPTION_TIERS.QUARTERLY;
      expect(tier.months).toBe(3);
      expect(tier.pricePerMonth).toBe(9.5);
      expect(tier.totalPrice).toBe(28.5);
      expect(tier.savingsPercent).toBe(21);
      expect(tier.recommended).toBe(true);
    });

    it("should have correct biannual tier pricing", () => {
      const tier = CRYPTO_SUBSCRIPTION_TIERS.BIANNUAL;
      expect(tier.months).toBe(6);
      expect(tier.pricePerMonth).toBe(9.0);
      expect(tier.totalPrice).toBe(54.0);
      expect(tier.savingsPercent).toBe(25);
    });

    it("should have correct annual tier pricing", () => {
      const tier = CRYPTO_SUBSCRIPTION_TIERS.ANNUAL;
      expect(tier.months).toBe(12);
      expect(tier.pricePerMonth).toBe(8.5);
      expect(tier.totalPrice).toBe(102.0);
      expect(tier.savingsPercent).toBe(29);
    });
  });

  describe("getCryptoTierByMonths", () => {
    it("should return correct tier for valid months", () => {
      expect(getCryptoTierByMonths(1)?.months).toBe(1);
      expect(getCryptoTierByMonths(3)?.months).toBe(3);
      expect(getCryptoTierByMonths(6)?.months).toBe(6);
      expect(getCryptoTierByMonths(12)?.months).toBe(12);
    });

    it("should return null for invalid months", () => {
      expect(getCryptoTierByMonths(2)).toBeNull();
      expect(getCryptoTierByMonths(5)).toBeNull();
      expect(getCryptoTierByMonths(0)).toBeNull();
      expect(getCryptoTierByMonths(-1)).toBeNull();
    });
  });

  describe("getAllCryptoTiers", () => {
    it("should return all tiers sorted by months", () => {
      const tiers = getAllCryptoTiers();
      expect(tiers).toHaveLength(4);
      expect(tiers[0].months).toBe(1);
      expect(tiers[1].months).toBe(3);
      expect(tiers[2].months).toBe(6);
      expect(tiers[3].months).toBe(12);
    });
  });

  describe("getCryptoPrice", () => {
    it("should return correct price for valid durations", () => {
      expect(getCryptoPrice(1)).toBe(10.0);
      expect(getCryptoPrice(3)).toBe(28.5);
      expect(getCryptoPrice(6)).toBe(54.0);
      expect(getCryptoPrice(12)).toBe(102.0);
    });

    it("should return 0 for invalid durations", () => {
      expect(getCryptoPrice(2)).toBe(0);
      expect(getCryptoPrice(0)).toBe(0);
    });
  });

  describe("getCryptoSavings", () => {
    it("should calculate correct savings vs card price", () => {
      // Card price is $12/month
      expect(getCryptoSavings(1)).toBe(2.0); // $12 - $10 = $2
      expect(getCryptoSavings(3)).toBe(7.5); // $36 - $28.50 = $7.50
      expect(getCryptoSavings(6)).toBe(18.0); // $72 - $54 = $18
      expect(getCryptoSavings(12)).toBe(42.0); // $144 - $102 = $42
    });

    it("should return 0 for invalid durations", () => {
      expect(getCryptoSavings(2)).toBe(0);
      expect(getCryptoSavings(0)).toBe(0);
    });
  });

  describe("getCryptoSavingsPercent", () => {
    it("should return correct savings percentage", () => {
      expect(getCryptoSavingsPercent(1)).toBe(17);
      expect(getCryptoSavingsPercent(3)).toBe(21);
      expect(getCryptoSavingsPercent(6)).toBe(25);
      expect(getCryptoSavingsPercent(12)).toBe(29);
    });

    it("should return 0 for invalid durations", () => {
      expect(getCryptoSavingsPercent(2)).toBe(0);
    });
  });

  describe("isValidCryptoDuration", () => {
    it("should return true for valid durations", () => {
      expect(isValidCryptoDuration(1)).toBe(true);
      expect(isValidCryptoDuration(3)).toBe(true);
      expect(isValidCryptoDuration(6)).toBe(true);
      expect(isValidCryptoDuration(12)).toBe(true);
    });

    it("should return false for invalid durations", () => {
      expect(isValidCryptoDuration(0)).toBe(false);
      expect(isValidCryptoDuration(2)).toBe(false);
      expect(isValidCryptoDuration(4)).toBe(false);
      expect(isValidCryptoDuration(5)).toBe(false);
      expect(isValidCryptoDuration(7)).toBe(false);
      expect(isValidCryptoDuration(24)).toBe(false);
    });
  });

  describe("CARD_PRICE_PER_MONTH", () => {
    it("should be $12", () => {
      expect(CARD_PRICE_PER_MONTH).toBe(12);
    });
  });

  describe("Pricing consistency", () => {
    it("should have totalPrice equal to pricePerMonth * months", () => {
      const tiers = getAllCryptoTiers();
      for (const tier of tiers) {
        expect(tier.totalPrice).toBe(tier.pricePerMonth * tier.months);
      }
    });

    it("should have increasing savings as duration increases", () => {
      const tiers = getAllCryptoTiers();
      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i].savingsPercent).toBeGreaterThan(
          tiers[i - 1].savingsPercent
        );
      }
    });

    it("should have decreasing price per month as duration increases", () => {
      const tiers = getAllCryptoTiers();
      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i].pricePerMonth).toBeLessThan(tiers[i - 1].pricePerMonth);
      }
    });
  });
});
