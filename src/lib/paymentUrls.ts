export const WERSEE_PAY_ORIGIN = 'https://pay.wersee.com';

const encodePaymentSegment = (value: unknown, label: string) => {
  const segment = String(value ?? '').trim().replace(/^@/, '');
  const hasControlCharacter = [...segment].some(character => character.charCodeAt(0) < 32);
  if (!segment || hasControlCharacter || /[/\\?#]/.test(segment)) {
    throw new Error(`Invalid ${label}.`);
  }
  return encodeURIComponent(segment);
};

export const werseePaymentUrls = {
  quickPay({
    username,
    slug,
    sandbox = false,
  }: {
    username: string;
    slug: string;
    sandbox?: boolean;
  }) {
    const path = `/${encodePaymentSegment(username, 'username')}/quick-pay/${encodePaymentSegment(slug, 'payment slug')}`;
    return `${WERSEE_PAY_ORIGIN}${sandbox ? `/s${path}` : path}`;
  },

  invoice({
    username,
    invoiceId,
    sandbox = false,
  }: {
    username: string;
    invoiceId: string;
    sandbox?: boolean;
  }) {
    const path = `/pay/invoice/${encodePaymentSegment(username, 'username')}/${encodePaymentSegment(invoiceId, 'invoice ID')}`;
    return `${WERSEE_PAY_ORIGIN}${sandbox ? `/sandbox${path}` : path}`;
  },
};
