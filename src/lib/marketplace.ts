export const parseMarketplaceMoneyToMinor = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 0 ? Math.round(value * 100) : null;
  }

  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const cents = Math.round(Number(normalized) * 100);
  return cents > 0 ? cents : null;
};

export const calculateMarketplaceFeeMinor = (grossMinor: number, feeBps = 200): number => {
  if (!Number.isInteger(grossMinor) || grossMinor < 0) return 0;
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10000) return 0;
  return Math.ceil((grossMinor * feeBps) / 10000);
};

export const canReleaseSellerTransfer = (input: {
  payoutsEnabled: boolean;
  payoutEligibility: string;
  paymentSettled: boolean;
  orderHoldEnded: boolean;
  hasComplianceHold: boolean;
  hasReserveHold: boolean;
  refundedOrDisputed: boolean;
  amountAlreadyTransferred: boolean;
  acceptedPayoutAgreement: boolean;
}) => {
  return (
    input.payoutsEnabled &&
    input.payoutEligibility === 'eligible' &&
    input.paymentSettled &&
    input.orderHoldEnded &&
    !input.hasComplianceHold &&
    !input.hasReserveHold &&
    !input.refundedOrDisputed &&
    !input.amountAlreadyTransferred &&
    input.acceptedPayoutAgreement
  );
};
