import { describe, expect, it } from 'vitest';
import { WERSEE_PAY_ORIGIN, werseePaymentUrls } from './paymentUrls';

describe('werseePaymentUrls', () => {
  it('keeps supported username characters and canonicalizes account handles', () => {
    expect(werseePaymentUrls.quickPay({
      username: '@wersee.cloud_d231',
      slug: 'launch-offer_2026',
    })).toBe(`${WERSEE_PAY_ORIGIN}/wersee.cloud_d231/quick-pay/launch-offer_2026`);

    expect(werseePaymentUrls.quickPay({
      username: 'creator-name',
      slug: 'pay.now',
      sandbox: true,
    })).toBe(`${WERSEE_PAY_ORIGIN}/s/creator-name/quick-pay/pay.now`);
  });

  it('builds live and sandbox invoice URLs without changing their identifiers', () => {
    expect(werseePaymentUrls.invoice({
      username: 'raevenvoge2',
      invoiceId: 'INV-2026-0506',
    })).toBe(`${WERSEE_PAY_ORIGIN}/pay/invoice/raevenvoge2/INV-2026-0506`);

    expect(werseePaymentUrls.invoice({
      username: '@raeven.production',
      invoiceId: 'INV_2026-01',
      sandbox: true,
    })).toBe(`${WERSEE_PAY_ORIGIN}/sandbox/pay/invoice/raeven.production/INV_2026-01`);
  });

  it('rejects values that can escape the payment route', () => {
    expect(() => werseePaymentUrls.invoice({
      username: 'seller/other',
      invoiceId: 'INV-1',
    })).toThrow('Invalid username');
  });
});
