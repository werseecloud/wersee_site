export const INVESTMENT_RISK_WARNING =
  'Investing involves risk. You may lose your entire investment. Wersee does not guarantee profit, returns, repayment, or resale opportunities and does not provide personal investment advice. Investments may be illiquid for a long time and may not be covered by deposit guarantee or investor compensation schemes. Read the KIIS and all risk documents before investing.';

export const RISK_ACCEPTANCE_TEXTS = [
  'I understand that I may lose my entire investment.',
  'I understand that Wersee does not guarantee profit, returns, or repayment.',
  'I understand that this investment may not be immediately resellable.',
  'I have read the current KIIS and investment terms.',
  'I understand that Wersee does not provide personal investment advice.',
];

export function formatMoney(cents: number | null | undefined, currency = 'eur') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format((cents ?? 0) / 100);
}

export function parseMoneyToCents(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function platformFeeCents(amountCents: number, feeBps = 200) {
  return Math.round((amountCents * feeBps) / 10_000);
}

export function daysRemaining(endAt?: string | null) {
  if (!endAt) return null;
  const diff = new Date(endAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function progressPercent(committedCents: number, goalCents: number) {
  if (!goalCents) return 0;
  return Math.min(100, Math.round((committedCents / goalCents) * 100));
}
