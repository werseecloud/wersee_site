import { invokeApiRunner } from '../lib/supabase';

export interface KycSessionResponse {
  client_secret: string;
  url: string;
}

export interface KycStatusResponse {
  status: 'not_started' | 'pending' | 'verified' | 'requires_input';
}

export const kycService = {
  async createSession(userId: string): Promise<KycSessionResponse> {
    return await invokeApiRunner('kyc-create-session', { userId });
  },

  async getStatus(userId: string): Promise<KycStatusResponse> {
    return await invokeApiRunner('kyc-status', { userId });
  },
};
