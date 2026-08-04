import { describe, expect, it } from 'vitest';
import { capabilityForTool, decodeJwtPayload, MCP_RESOURCE_URL, sanitizeForAudit, sha256 } from './app';

const tokenWithPayload = (payload: Record<string, unknown>) => [
  Buffer.from('{}').toString('base64url'),
  Buffer.from(JSON.stringify(payload)).toString('base64url'),
  'signature',
].join('.');

describe('Wersee MCP security boundary', () => {
  it('uses only the dedicated MCP domain as its resource URL', () => {
    expect(MCP_RESOURCE_URL).toBe('https://mcp.wersee.com/v1');
  });

  it('reads the OAuth client_id claim without trusting malformed tokens', () => {
    expect(decodeJwtPayload(tokenWithPayload({ sub: 'user-1', client_id: 'client-1' }))).toMatchObject({ client_id: 'client-1' });
    expect(decodeJwtPayload('not-a-token')).toEqual({});
  });

  it('makes confirmations argument-order independent but value sensitive', () => {
    expect(sha256({ name: 'Link', price: 12, nested: { b: 2, a: 1 } }))
      .toBe(sha256({ nested: { a: 1, b: 2 }, price: 12, name: 'Link' }));
    expect(sha256({ price: 12 })).not.toBe(sha256({ price: 13 }));
  });

  it('redacts message content, email, and secrets from audit payloads', () => {
    expect(sanitizeForAudit({ text: 'private message', customerEmail: 'buyer@example.com', secretKey: 'abc', listingId: 'listing-1' }))
      .toEqual({
        text: { redacted: true, length: 15 },
        customerEmail: { redacted: true, length: 17 },
        secretKey: { redacted: true, length: 3 },
        listingId: 'listing-1',
      });
  });

  it('maps tool categories to the selected capability groups', () => {
    const tool = (category: string) => ({ category } as any);
    expect(capabilityForTool(tool('money'))).toBe('payments');
    expect(capabilityForTool(tool('products'))).toBe('listings');
    expect(capabilityForTool(tool('messages'))).toBe('messages');
    expect(capabilityForTool(tool('storage'))).toBe('storage');
    expect(capabilityForTool(tool('websites'))).toBe('development');
    expect(capabilityForTool(tool('orders'))).toBe('management');
    expect(capabilityForTool(tool('analytics'))).toBe('analytics');
  });
});
