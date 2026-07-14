import type { AuthError, PasskeyListItem } from '@supabase/supabase-js';

export type UserPasskey = Omit<PasskeyListItem, 'friendly_name' | 'last_used_at'> & {
  friendly_name?: string | null;
  last_used_at?: string | null;
};

export const isPasskeySupported = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  'PublicKeyCredential' in window;

type PasskeyErrorLike = Partial<AuthError> & {
  code?: string;
  name?: string;
  message?: string;
};

const passkeyErrorMessages: Record<string, string> = {
  passkey_disabled: 'Passkeys are not enabled for this Wersee project yet.',
  too_many_passkeys: 'You have reached the maximum number of passkeys. Revoke an existing passkey first.',
  webauthn_credential_exists: 'This passkey is already linked to your account.',
  webauthn_credential_not_found: 'This passkey was not found for your account.',
  webauthn_challenge_not_found: 'The security request is no longer valid. Please try again.',
  webauthn_challenge_expired: 'The security request has expired. Please try again.',
  webauthn_verification_failed: 'The passkey could not be verified. Please try again.',
  email_not_confirmed: 'Confirm your email address before using passkeys.',
  phone_not_confirmed: 'Confirm your phone number before using passkeys.',
  user_banned: 'This account has been blocked. Contact support.',
};

export const isPasskeyCancellation = (error: unknown) => {
  const err = error as PasskeyErrorLike;
  const name = err?.name?.toLowerCase() ?? '';
  const message = err?.message?.toLowerCase() ?? '';

  return (
    name === 'notallowederror' ||
    message.includes('notallowederror') ||
    message.includes('the operation either timed out or was not allowed') ||
    message.includes('request is not allowed') ||
    message.includes('cancel') ||
    message.includes('abort')
  );
};

export const getPasskeyErrorMessage = (error: unknown) => {
  if (isPasskeyCancellation(error)) {
    return 'The passkey request was canceled.';
  }

  const err = error as PasskeyErrorLike;
  const code = err?.code;
  const message = err?.message ?? '';
  const lowerMessage = message.toLowerCase();

  if (code && passkeyErrorMessages[code]) {
    return passkeyErrorMessages[code];
  }

  const matchedCode = Object.keys(passkeyErrorMessages).find((knownCode) =>
    lowerMessage.includes(knownCode),
  );

  if (matchedCode) {
    return passkeyErrorMessages[matchedCode];
  }

  if (lowerMessage.includes('sso')) {
    return 'This account cannot register passkeys right now. Use another available sign-in method.';
  }

  if (lowerMessage.includes('browser does not support webauthn') || lowerMessage.includes('not secure')) {
    return 'Passkeys require a modern browser and a secure HTTPS connection. Localhost still works for development.';
  }

  return 'Something went wrong with passkeys. Please try again.';
};

const passkeyTimestamp = (passkey: UserPasskey) =>
  new Date(passkey.last_used_at ?? passkey.created_at).getTime();

export const sortPasskeys = (passkeys: UserPasskey[]) =>
  [...passkeys].sort((a, b) => {
    const byLastActivity = passkeyTimestamp(b) - passkeyTimestamp(a);
    if (byLastActivity !== 0) return byLastActivity;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
