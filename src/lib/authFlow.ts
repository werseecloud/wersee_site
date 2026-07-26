export type AuthView = 'credentials' | 'security' | 'code' | 'success';

export type AuthOperation =
  | 'idle'
  | 'validating'
  | 'checking_password'
  | 'ready'
  | 'creating_account'
  | 'sending_verification'
  | 'verification_sent'
  | 'verifying_code'
  | 'success'
  | 'recoverable_error'
  | 'fatal_error';

export type AuthMachineState = {
  view: AuthView;
  operation: AuthOperation;
  firstVerificationSent: boolean;
  failedAt: AuthOperation | null;
};

export type AuthMachineEvent =
  | { type: 'SYNC_VIEW'; view: AuthView }
  | { type: 'BEGIN'; operation: Exclude<AuthOperation, 'idle' | 'ready' | 'verification_sent' | 'success' | 'recoverable_error' | 'fatal_error'> }
  | { type: 'READY' }
  | { type: 'VERIFICATION_SENT' }
  | { type: 'SUCCESS' }
  | { type: 'FAIL'; at: AuthOperation; fatal?: boolean }
  | { type: 'RESET'; view?: AuthView };

export const createInitialAuthMachine = (view: AuthView = 'credentials'): AuthMachineState => ({
  view,
  operation: 'idle',
  firstVerificationSent: false,
  failedAt: null,
});

export const authMachineReducer = (state: AuthMachineState, event: AuthMachineEvent): AuthMachineState => {
  switch (event.type) {
    case 'SYNC_VIEW':
      return { ...state, view: event.view };
    case 'BEGIN':
      return { ...state, operation: event.operation, failedAt: null };
    case 'READY':
      return { ...state, operation: 'ready', failedAt: null };
    case 'VERIFICATION_SENT':
      return {
        ...state,
        view: 'success',
        operation: 'verification_sent',
        firstVerificationSent: true,
        failedAt: null,
      };
    case 'SUCCESS':
      return { ...state, view: 'success', operation: 'success', failedAt: null };
    case 'FAIL':
      return {
        ...state,
        operation: event.fatal ? 'fatal_error' : 'recoverable_error',
        failedAt: event.at,
      };
    case 'RESET':
      return createInitialAuthMachine(event.view);
    default:
      return state;
  }
};

export type SafeAuthError = {
  code: string;
  message: string;
  cooldownSeconds?: number;
};

const includesAny = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

export const mapAuthError = (error: unknown): SafeAuthError => {
  const source = error as { message?: string; code?: string; status?: number } | null;
  const message = String(source?.message || '').toLowerCase();
  const code = String(source?.code || '').toLowerCase();
  const status = Number(source?.status || 0);

  if (status === 429 || includesAny(`${code} ${message}`, ['rate limit', 'too many', 'over_email_send_rate_limit'])) {
    return { code: 'RATE_LIMITED', message: 'Er zijn te veel pogingen gedaan. Probeer het over enkele minuten opnieuw.', cooldownSeconds: 60 };
  }
  if (includesAny(`${code} ${message}`, ['already registered', 'already exists', 'user_already_exists', 'identity_already_exists'])) {
    return {
      code: 'ACCOUNT_UNAVAILABLE',
      message: 'Er kan geen nieuw account met dit e-mailadres worden aangemaakt. Probeer in te loggen of vraag een magische link aan.',
    };
  }
  if (includesAny(`${code} ${message}`, ['invalid email', 'email_address_invalid'])) {
    return { code: 'INVALID_EMAIL', message: 'Vul een geldig e-mailadres in.' };
  }
  if (includesAny(`${code} ${message}`, ['invalid login credentials', 'email or password is incorrect', 'invalid_credentials'])) {
    return { code: 'INVALID_CREDENTIALS', message: 'Het e-mailadres of wachtwoord is onjuist.' };
  }
  if (includesAny(`${code} ${message}`, ['weak password', 'password should', 'password is too'])) {
    return { code: 'WEAK_PASSWORD', message: 'Kies een sterker wachtwoord dat aan alle vereisten voldoet.' };
  }
  if (includesAny(`${code} ${message}`, ['database error', 'unexpected_failure', 'saving new user', 'profile'])) {
    return { code: 'ACCOUNT_DATABASE_ERROR', message: 'Account aanmaken is tijdelijk niet gelukt. Probeer het opnieuw.' };
  }
  if (includesAny(`${code} ${message}`, ['failed to fetch', 'network', 'offline', 'load failed'])) {
    return { code: 'NETWORK_ERROR', message: 'De verbinding is onderbroken. Controleer je internetverbinding en probeer het opnieuw.' };
  }
  if (includesAny(`${code} ${message}`, ['timeout', 'timed out', 'aborterror'])) {
    return { code: 'REQUEST_TIMEOUT', message: 'De aanvraag duurde te lang. Controleer je verbinding en probeer het opnieuw.' };
  }
  if (status >= 500 || includesAny(`${code} ${message}`, ['unavailable', 'service'])) {
    return { code: 'AUTH_UNAVAILABLE', message: 'Account aanmaken is tijdelijk niet gelukt. Probeer het later opnieuw.' };
  }

  return { code: 'UNKNOWN_AUTH_ERROR', message: 'Account aanmaken is tijdelijk niet gelukt. Probeer het opnieuw.' };
};

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const createAuthReference = () => {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `AUTH-${id.toUpperCase()}`;
};
