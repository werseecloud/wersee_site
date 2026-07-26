import { supabase, supabasePublishableKey, supabaseUrl } from '../lib/supabase';
import type { AiMode, AiPageContext, AiStreamEvent } from './types';

export class WerseeAiError extends Error {
  constructor(
    message: string,
    public readonly code = 'AI_REQUEST_FAILED',
    public readonly retryable = false,
    public readonly status = 500,
  ) {
    super(message);
    this.name = 'WerseeAiError';
  }
}

const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/wersee-ai`;

const networkError = (reason: unknown) => {
  if (reason instanceof DOMException && reason.name === 'AbortError') return reason;
  return new WerseeAiError(
    'Wersee AI is temporarily unreachable. Check your connection and try again.',
    'AI_NETWORK_ERROR',
    true,
    0,
  );
};

export const asWerseeAiError = (reason: unknown, fallback = 'Wersee AI could not complete the request.') =>
  reason instanceof WerseeAiError ? reason : new WerseeAiError(fallback, 'AI_REQUEST_FAILED', true);

const getHeaders = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new WerseeAiError('Could not read your session.', 'AUTH_SESSION_FAILED', true, 401);
  const token = data.session?.access_token;
  if (!token) throw new WerseeAiError('Sign in to use Wersee AI.', 'UNAUTHORIZED', false, 401);
  return {
    authorization: `Bearer ${token}`,
    apikey: supabasePublishableKey,
    'content-type': 'application/json',
  };
};

const parseError = async (response: Response) => {
  let payload: any;
  try { payload = await response.json(); } catch { payload = null; }
  const error = payload?.error;
  return new WerseeAiError(
    typeof error?.message === 'string' ? error.message : 'Wersee AI could not complete the request.',
    typeof error?.code === 'string' ? error.code : 'AI_REQUEST_FAILED',
    Boolean(error?.retryable),
    response.status,
  );
};

export class WerseeAiClient {
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${functionUrl}${path}`, {
        ...init,
        headers: { ...(await getHeaders()), ...(init.headers || {}) },
        cache: 'no-store',
      });
    } catch (reason) {
      throw networkError(reason);
    }
    if (!response.ok) throw await parseError(response);
    try {
      return await response.json() as T;
    } catch {
      throw new WerseeAiError('Wersee AI returned an invalid response.', 'AI_INVALID_RESPONSE', true, response.status);
    }
  }

  async *chat(input: {
    conversationId?: string;
    message: string;
    mode: AiMode;
    context?: AiPageContext;
    attachments?: Array<{ name: string; type: 'image' | 'file' | 'context'; storagePath?: string; excerpt?: string }>;
    idempotencyKey?: string;
    signal?: AbortSignal;
  }): AsyncGenerator<AiStreamEvent> {
    let response: Response;
    try {
      response = await fetch(`${functionUrl}/chat`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({
          conversationId: input.conversationId,
          message: input.message,
          mode: input.mode,
          context: input.context || {},
          attachments: input.attachments || [],
          idempotencyKey: input.idempotencyKey || crypto.randomUUID(),
        }),
        signal: input.signal,
      });
    } catch (reason) {
      throw networkError(reason);
    }
    if (!response.ok) throw await parseError(response);
    if (!response.body) throw new WerseeAiError('Wersee AI returned no event stream.', 'AI_EMPTY_STREAM', true);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() || '';
        for (const frame of frames) {
          const data = frame.split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())
            .join('');
          if (!data) continue;
          try { yield JSON.parse(data) as AiStreamEvent; } catch { /* Ignore malformed keep-alive frames. */ }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  listConversations(businessId?: string) {
    const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
    return this.request<{ conversations: any[] }>(`/conversations${query}`);
  }

  getConversation(id: string) {
    return this.request<{ conversation: any; messages: any[]; actions: any[] }>(`/conversations/${encodeURIComponent(id)}/messages`);
  }

  createConversation(input: { title?: string; mode: AiMode; businessId?: string }) {
    return this.request<{ conversation: any }>('/conversations', { method: 'POST', body: JSON.stringify(input) });
  }

  archiveConversation(id: string) {
    return this.request(`/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  approveAction(id: string, editedArguments?: Record<string, unknown>) {
    return this.request<{ actionId: string; result: any }>(`/actions/${encodeURIComponent(id)}/approve`, { method: 'POST', body: JSON.stringify({ editedArguments }) });
  }

  rejectAction(id: string) {
    return this.request(`/actions/${encodeURIComponent(id)}/reject`, { method: 'POST', body: '{}' });
  }

  undoAction(id: string) {
    return this.request<{ actionId: string; result: any }>(`/actions/${encodeURIComponent(id)}/undo`, { method: 'POST', body: '{}' });
  }

  cancelRun(id: string) {
    return this.request(`/runs/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: '{}' });
  }

  getPermissions(businessId?: string) {
    const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
    return this.request<{ permissions: any; allowedScopes: string[] }>(`/permissions${query}`);
  }

  updatePermissions(input: { businessId?: string; agentEnabled: boolean; memoryEnabled: boolean; scopes: string[] }) {
    return this.request<{ permissions: any }>('/permissions', { method: 'PUT', body: JSON.stringify(input) });
  }

  getActivity(businessId?: string) {
    const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
    return this.request<{ activity: any[] }>(`/activity${query}`);
  }

  getUsage(businessId?: string) {
    const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
    return this.request<{ period: any; usage: any }>(`/usage${query}`);
  }

  listInstructions(businessId?: string) {
    const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
    return this.request<{ instructions: any[] }>(`/instructions${query}`);
  }

  saveInstruction(input: { businessId?: string; label: string; instruction: string; isActive?: boolean }) {
    return this.request<{ instruction: any }>('/instructions', { method: 'POST', body: JSON.stringify(input) });
  }

  deleteInstruction(id: string) {
    return this.request(`/instructions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  generateText(input: { contents: unknown; config?: Record<string, unknown> }, signal?: AbortSignal) {
    return this.request<{ text: string }>('/generate', { method: 'POST', body: JSON.stringify(input), signal });
  }

  generateListingDraft(input: { kind: string; idea: string; currentDraft: Record<string, unknown>; context?: AiPageContext }) {
    return this.request<{ draft: Record<string, unknown>; summary: string; mutationPerformed: false }>('/listing-draft', { method: 'POST', body: JSON.stringify(input) });
  }
}

export const werseeAi = new WerseeAiClient();
