import { describe, expect, it, vi } from 'vitest';
import { createMigratingStorage, type BrowserStorageLike } from './browserStorage';

const createMemoryStorage = () => {
  const values = new Map<string, string>();
  const storage: BrowserStorageLike = {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn((key) => values.delete(key)),
  };
  return { storage, values };
};

describe('project-scoped browser storage migration', () => {
  it('moves the legacy session to the project-specific key once', () => {
    const { storage, values } = createMemoryStorage();
    values.set('sb-auth-token', 'stored-session');
    const migrating = createMigratingStorage(
      storage,
      'sb-auth-token',
      'sb-project-auth-token',
    );

    expect(migrating.getItem('sb-project-auth-token')).toBe('stored-session');
    expect(values.get('sb-project-auth-token')).toBe('stored-session');
    expect(values.has('sb-auth-token')).toBe(false);
  });

  it('clears both current and leftover legacy auth chunks', () => {
    const { storage, values } = createMemoryStorage();
    values.set('sb-auth-token.0', 'legacy-chunk');
    values.set('sb-project-auth-token.0', 'current-chunk');
    const migrating = createMigratingStorage(
      storage,
      'sb-auth-token',
      'sb-project-auth-token',
    );

    migrating.removeItem('sb-project-auth-token.0');
    expect(values.has('sb-project-auth-token.0')).toBe(false);
    expect(values.has('sb-auth-token.0')).toBe(false);
  });
});
