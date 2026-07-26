import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { decideToolPolicy } from '../../../supabase/functions/wersee-ai/policyEngine';
import type { WerseeAiTool } from '../../../supabase/functions/wersee-ai/types';

const tool = (overrides: Partial<WerseeAiTool> = {}): WerseeAiTool => ({
  name: 'test.action',
  description: 'A test action',
  category: 'test',
  riskLevel: 'low',
  requiredScopes: ['test_scope'],
  inputSchema: z.object({}).strict(),
  inputHint: '{}',
  execute: async () => ({ summary: 'done' }),
  ...overrides,
});

describe('Wersee AI policy engine', () => {
  it('allows read-only tools without approval', () => {
    expect(decideToolPolicy({ tool: tool({ riskLevel: 'read' }), mode: 'assistant', grantedScopes: [], agentEnabled: false, isOwner: true }))
      .toEqual({ allowed: true, requiresApproval: false });
  });

  it('requires approval for every assistant mutation', () => {
    expect(decideToolPolicy({ tool: tool(), mode: 'assistant', grantedScopes: ['test_scope'], agentEnabled: true, isOwner: true }).requiresApproval).toBe(true);
  });

  it('allows scoped low-risk agent work without approval', () => {
    expect(decideToolPolicy({ tool: tool(), mode: 'agent', grantedScopes: ['test_scope'], agentEnabled: true, isOwner: true }).requiresApproval).toBe(false);
  });

  it('always requires approval for publishing and financial scopes', () => {
    expect(decideToolPolicy({ tool: tool({ requiredScopes: ['publish_products'] }), mode: 'agent', grantedScopes: ['publish_products'], agentEnabled: true, isOwner: true }).requiresApproval).toBe(true);
    expect(decideToolPolicy({ tool: tool({ requiredScopes: ['financial_commitments'] }), mode: 'agent', grantedScopes: ['financial_commitments'], agentEnabled: true, isOwner: true }).requiresApproval).toBe(true);
    expect(decideToolPolicy({ tool: tool({ requiredScopes: ['delete_data'] }), mode: 'agent', grantedScopes: ['delete_data'], agentEnabled: true, isOwner: true }).requiresApproval).toBe(true);
  });

  it('denies restricted tools and owner-only settings for members', () => {
    expect(decideToolPolicy({ tool: tool({ riskLevel: 'restricted' }), mode: 'agent', grantedScopes: [], agentEnabled: true, isOwner: true }).allowed).toBe(false);
    expect(decideToolPolicy({ tool: tool({ requiredScopes: ['manage_payments'] }), mode: 'agent', grantedScopes: ['manage_payments'], agentEnabled: true, isOwner: false }).allowed).toBe(false);
  });
});
