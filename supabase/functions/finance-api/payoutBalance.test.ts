import { describe, expect, it } from "vitest";
import {
  getPayoutEligibility,
  normalizePayoutCurrency,
  parsePayoutAmountMinor,
  summarizeStripeBalance,
} from "./payoutBalance";

describe("manual payout balance helpers", () => {
  it("parses exact decimal amounts without floating-point rounding", () => {
    expect(parsePayoutAmountMinor("12.34")).toBe(1234);
    expect(parsePayoutAmountMinor("12,3")).toBe(1230);
    expect(parsePayoutAmountMinor(1234)).toBe(1234);
  });

  it("rejects invalid amounts and currencies", () => {
    expect(() => parsePayoutAmountMinor("1.999")).toThrow("INVALID_AMOUNT");
    expect(() => parsePayoutAmountMinor("-1")).toThrow("INVALID_AMOUNT");
    expect(() => normalizePayoutCurrency("EURO")).toThrow("INVALID_CURRENCY");
  });

  it("sums only the requested currency", () => {
    expect(summarizeStripeBalance({
      available: [
        { amount: 800, currency: "eur" },
        { amount: 200, currency: "EUR" },
        { amount: 999, currency: "usd" },
      ],
      pending: [{ amount: 450, currency: "eur" }],
    }, "eur")).toEqual({ availableMinor: 1000, pendingMinor: 450 });
  });

  it("allows an exact available balance and reports a shortfall", () => {
    expect(getPayoutEligibility(1000, 1000)).toEqual({
      eligible: true,
      shortfallMinor: 0,
    });
    expect(getPayoutEligibility(1200, 1000)).toEqual({
      eligible: false,
      shortfallMinor: 200,
    });
  });
});
