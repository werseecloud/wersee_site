import { describe, expect, it, vi } from 'vitest';
import { archiveListingTool, createDraftSchema, createListingDraftTool, deleteListingTool, listingConversionDiagnosticsTool, updateInput } from '../../../supabase/functions/wersee-ai/tools/listings';
import { dateRangeInput, productPerformanceInput } from '../../../supabase/functions/wersee-ai/tools/analytics';
import { createAdDraftTool, updateBusinessCopyTool, updateOrderShippingTool } from '../../../supabase/functions/wersee-ai/tools/operations';

describe('Wersee AI tool validation', () => {
  it('accepts a bounded structured product draft', () => {
    const draft = createDraftSchema.parse({ title: 'AI agency blueprint', description: 'A complete blueprint for launching and operating a focused AI agency.', price: 49, currency: 'eur', kind: 'digital', category: 'Business' });
    expect(draft.currency).toBe('EUR');
    expect(draft.features).toEqual([]);
  });

  it('rejects unknown fields, invalid prices, and empty updates', () => {
    expect(createDraftSchema.safeParse({ title: 'Bad', description: 'short', price: -1, kind: 'digital', category: 'Test', providerApiKey: 'secret' }).success).toBe(false);
    expect(updateInput.safeParse({ listingId: '75597558-12d7-4358-8262-4df67ca55b99', patch: {} }).success).toBe(false);
  });

  it('enforces bounded analytics windows and result limits', () => {
    expect(dateRangeInput.safeParse({ days: 365 }).success).toBe(true);
    expect(dateRangeInput.safeParse({ days: 366 }).success).toBe(false);
    expect(productPerformanceInput.safeParse({ days: 30, limit: 26 }).success).toBe(false);
  });

  it('keeps destructive product tools explicit and strictly validated', () => {
    const listingId = '75597558-12d7-4358-8262-4df67ca55b99';
    expect(archiveListingTool.alwaysConfirm).toBe(true);
    expect(deleteListingTool.alwaysConfirm).toBe(true);
    expect(deleteListingTool.inputSchema.safeParse({ listingId, unexpected: true }).success).toBe(false);
    expect(listingConversionDiagnosticsTool.inputSchema.safeParse({ listingId, days: 366 }).success).toBe(false);
  });

  it('strictly bounds operational drafts and non-financial order updates', () => {
    const orderId = '75597558-12d7-4358-8262-4df67ca55b99';
    expect(createAdDraftTool.inputSchema.safeParse({ title: 'Launch plan', type: 'marketplace', dailyBudget: 25, targeting: {}, launchNow: true }).success).toBe(false);
    expect(updateOrderShippingTool.inputSchema.safeParse({ orderId, shippingStatus: 'refunded' }).success).toBe(false);
    expect(updateBusinessCopyTool.alwaysConfirm).toBe(true);
  });

  it('replays an existing idempotent draft without inserting again', async () => {
    const existing = { id: '75597558-12d7-4358-8262-4df67ca55b99', title: 'Existing draft' };
    const maybeSingle = vi.fn().mockResolvedValue({ data: existing, error: null });
    const query: any = { select: vi.fn(() => query), eq: vi.fn(() => query), maybeSingle };
    const from = vi.fn(() => query);
    const context: any = { user: { id: '9e38a128-5638-498c-b2f4-6dd78ef5ce06' }, userClient: { from } };
    const input = createDraftSchema.parse({ title: 'Existing draft', description: 'A sufficiently detailed draft description for an idempotency test.', price: 25, kind: 'digital', category: 'Business' });
    const result = await createListingDraftTool.execute(context, input, 'same-idempotency-key');
    expect(result.data?.idempotentReplay).toBe(true);
    expect(from).toHaveBeenCalledTimes(1);
  });
});
