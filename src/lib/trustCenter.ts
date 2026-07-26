import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type ComplianceAction = {
  code: string;
  title: string;
  explanation: string;
  action?: string;
};

export type ComplianceDecision = {
  id: string;
  allowed: boolean;
  requiredActions: ComplianceAction[];
  blockingIssues: ComplianceAction[];
  warnings: ComplianceAction[];
  disclosures: ComplianceAction[];
  auditReason: string;
  policyVersion: string;
};

export class TrustCenterError extends Error {
  code?: string;
  details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'TrustCenterError';
    this.code = code;
    this.details = details;
  }
}

export async function trustCenterAction<T>(action: string, input: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('trust-center', { body: { action, input } });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const payload = await error.context.json();
        throw new TrustCenterError(payload.error || error.message, payload.code, payload.details);
      } catch (contextError) {
        if (contextError instanceof TrustCenterError) throw contextError;
      }
    }
    throw new TrustCenterError(error.message || 'The Trust Center could not complete this request.');
  }

  if (!data?.success) {
    throw new TrustCenterError(data?.error || 'The Trust Center could not complete this request.', data?.code, data?.details);
  }

  return data as T;
}

export const evaluateCompliance = (action: string, context: Record<string, unknown> = {}) =>
  trustCenterAction<{ success: true; decision: ComplianceDecision }>('evaluate', { action, context });

