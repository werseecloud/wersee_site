import { describe, expect, it } from 'vitest';
import {
  authMachineReducer,
  createInitialAuthMachine,
  isValidEmail,
  mapAuthError,
} from './authFlow';

describe('auth flow state machine', () => {
  it('cannot claim a resend before the first verification send succeeds', () => {
    const initial = createInitialAuthMachine();
    expect(initial.firstVerificationSent).toBe(false);

    const creating = authMachineReducer(initial, { type: 'BEGIN', operation: 'creating_account' });
    expect(creating.firstVerificationSent).toBe(false);

    const sent = authMachineReducer(creating, { type: 'VERIFICATION_SENT' });
    expect(sent.firstVerificationSent).toBe(true);
    expect(sent.operation).toBe('verification_sent');
    expect(sent.view).toBe('success');
  });

  it('returns recoverable failures to an explicit failed stage', () => {
    const state = authMachineReducer(createInitialAuthMachine('credentials'), {
      type: 'FAIL',
      at: 'validating',
    });
    expect(state.operation).toBe('recoverable_error');
    expect(state.failedAt).toBe('validating');
    expect(state.view).toBe('credentials');
  });
});

describe('auth validation and safe errors', () => {
  it('validates email syntax before a network request', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('  user@example.com ')).toBe(true);
  });

  it('maps duplicate accounts without exposing whether an account exists', () => {
    const result = mapAuthError({ code: 'user_already_exists', message: 'User already registered' });
    expect(result.code).toBe('ACCOUNT_UNAVAILABLE');
    expect(result.message).not.toContain('bestaat al');
    expect(result.message).toContain('Probeer in te loggen');
  });

  it('maps rate limits and network failures to recoverable Dutch copy', () => {
    expect(mapAuthError({ status: 429, message: 'rate limit' }).cooldownSeconds).toBe(60);
    expect(mapAuthError(new TypeError('Failed to fetch')).code).toBe('NETWORK_ERROR');
  });
});
