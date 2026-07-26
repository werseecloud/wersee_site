import { supabase } from '@/lib/supabase';
import type { StorageApiErrorPayload } from './types';

export class WerseeStorageError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public requestId?: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const storageAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new WerseeStorageError('AUTH_REQUIRED', 'Sign in to use Wersee storage.', 401);
  return { Authorization: `Bearer ${token}` };
};

export const storageApi = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = await storageAuthHeaders();
  const response = await fetch(`/api/storage${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as StorageApiErrorPayload | null;
    throw new WerseeStorageError(
      payload?.error?.code || `STORAGE_HTTP_${response.status}`,
      payload?.error?.message || 'Wersee storage could not complete this request.',
      response.status,
      payload?.error?.requestId,
      payload?.error?.details,
    );
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
};

export const isTemporaryStorageFailure = (error: unknown) =>
  error instanceof TypeError
  || (
    error instanceof WerseeStorageError
    && (error.status === 429 || error.status >= 500)
  );
