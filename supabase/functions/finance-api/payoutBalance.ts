export type StripeBalanceAmount = {
  amount: number;
  currency: string;
};

export type StripeBalanceSnapshot = {
  available?: StripeBalanceAmount[];
  pending?: StripeBalanceAmount[];
};

export const normalizePayoutCurrency = (value: unknown) => {
  const currency = String(value || "eur").trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) {
    throw new Error("INVALID_CURRENCY");
  }
  return currency;
};

export const parsePayoutAmountMinor = (value: unknown) => {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("INVALID_AMOUNT");
    return value;
  }

  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error("INVALID_AMOUNT");
  }

  const [whole, decimal = ""] = normalized.split(".");
  const amountMinor = (Number(whole) * 100) + Number(decimal.padEnd(2, "0"));
  if (!Number.isSafeInteger(amountMinor)) throw new Error("INVALID_AMOUNT");
  return amountMinor;
};

export const summarizeStripeBalance = (
  balance: StripeBalanceSnapshot,
  currency: string,
) => {
  const totalForCurrency = (rows: StripeBalanceAmount[] | undefined) =>
    (rows || [])
      .filter((row) => row.currency.toLowerCase() === currency)
      .reduce((total, row) => total + row.amount, 0);

  return {
    availableMinor: totalForCurrency(balance.available),
    pendingMinor: totalForCurrency(balance.pending),
  };
};

export const getPayoutEligibility = (
  amountMinor: number,
  availableMinor: number,
) => ({
  eligible: amountMinor >= 100 && availableMinor >= amountMinor,
  shortfallMinor: Math.max(0, amountMinor - availableMinor),
});
