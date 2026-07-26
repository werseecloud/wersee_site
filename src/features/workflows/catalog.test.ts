import { describe, expect, it } from 'vitest';
import { createManualDefinition, safeTestPayload } from './catalog';

describe('workflow catalog', () => {
  it('creates a connected, human-readable purchase workflow', () => {
    const definition = createManualDefinition('purchase', 'email');

    expect(definition.nodes).toHaveLength(2);
    expect(definition.edges).toEqual([
      expect.objectContaining({ source: 'trigger', target: 'action_1' }),
    ]);
    expect(definition.requiredConnections).toContain('email');
    expect(definition.summary).toMatch(/customer purchases/i);
    expect(definition.nodes[1].config.to).toBe('{{trigger.customer_email}}');
  });

  it('uses visibly fake customer data for safe purchase tests', () => {
    const payload = safeTestPayload(createManualDefinition('payment_failed', 'notification'));

    expect(payload).toMatchObject({
      order_id: 'test-order',
      customer_email: 'alex@example.com',
      payment_status: 'failed',
      test_data: true,
    });
  });

  it('adds a usable default schedule without a required integration', () => {
    const definition = createManualDefinition('schedule', 'notification');

    expect(definition.trigger.config.cron).toBe('0 9 * * *');
    expect(definition.requiredConnections).toEqual([]);
  });
});
