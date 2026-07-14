import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  buildAppUrl,
  clearAuthEmail2faPending,
  invokeApiRunner,
  isAuthEmail2faPending,
  setAuthEmail2faPending,
  supabase,
  trackCurrentAuthDevice,
} from '../lib/supabase';
import { ArrowLeft, Loader2, Mail, Lock, Sparkles, ArrowRight, CheckCircle2, Eye, EyeOff, AlertCircle, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WerseeCaptcha } from '../components/WerseeCaptcha';
import { SEO } from '../components/SEO';
import { getPasskeyErrorMessage, isPasskeyCancellation, isPasskeySupported } from '../lib/passkeys';

type PasswordLeakStatus = 'idle' | 'checking' | 'safe' | 'pwned' | 'error';
type AuthFlowStep = 'credentials' | 'security' | 'code' | 'success';

type AuthFlowSession = {
  id: string;
  step: AuthFlowStep;
  email?: string | null;
  redirect?: string;
  ref?: string | null;
  expiresAt: string;
};

type AuthFlowFunctionResponse = {
  session?: AuthFlowSession;
  error?: string;
};

type AuthEmail2faResponse = {
  success?: boolean;
  email?: string;
  expiresInMinutes?: number;
  error?: string;
};

const PWNED_PASSWORD_MESSAGE = 'This password has appeared in a known data breach. Choose a different password.';
const PWNED_PASSWORD_CHECK_ERROR =
  'We could not complete the password safety check. Please try again before creating your account.';
const AUTH_STEP_TO_NUMBER: Record<AuthFlowStep, number> = {
  credentials: 1,
  security: 2,
  success: 3,
  code: 4,
};
const AUTH_NUMBER_TO_STEP: Record<number, AuthFlowStep> = {
  1: 'credentials',
  2: 'security',
  3: 'success',
  4: 'code',
};
const AUTH_FLOW_EXPIRED_MESSAGE = 'Your secure login session expired. A new login session has been started.';

const isAuthFlowStep = (value: unknown): value is AuthFlowStep =>
  value === 'credentials' || value === 'security' || value === 'code' || value === 'success';

const authFlowPath = (stepName: AuthFlowStep, sessionId: string, queryString: string) =>
  `/auth/flow/${stepName}/${sessionId}${queryString ? `?${queryString}` : ''}`;

const sha1Hex = async (value: string) => {
  if (!crypto?.subtle) {
    throw new Error('Password safety checks are not available in this browser.');
  }

  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
};

const isPasswordPwned = async (value: string) => {
  const hash = await sha1Hex(value);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    method: 'GET',
    headers: {
      'Add-Padding': 'true',
    },
  });

  if (!response.ok) {
    throw new Error('Password safety check failed.');
  }

  const body = await response.text();
  return body
    .split('\n')
    .some((line) => line.split(':')[0].trim().toUpperCase() === suffix);
};

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLeakStatus, setPasswordLeakStatus] = useState<PasswordLeakStatus>('idle');
  const [passwordLeakMessage, setPasswordLeakMessage] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1: Credentials, 2: Security, 3: Success, 4: Email code
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loginCode, setLoginCode] = useState('');
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [flowSessionId, setFlowSessionId] = useState<string | null>(null);
  const [flowExpiresAt, setFlowExpiresAt] = useState<string | null>(null);
  const [flowLoading, setFlowLoading] = useState(true);
  
  // Security: Login attempts limiting
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();
  const { authStep, authSessionId } = useParams<{ authStep?: string; authSessionId?: string }>();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');
  const redirect = searchParams.get('redirect') || '/workspace';
  const queryString = searchParams.toString();
  const hasNavigatedRef = useRef(false);
  const passwordLeakRequestRef = useRef(0);
  const passkeysSupported = isPasskeySupported();

  const navigateAfterAuth = () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigate(redirect, { replace: true });
  };

  const readFlowResponse = (data: unknown, fallbackError: string) => {
    const response = data as AuthFlowFunctionResponse | null;
    if (response?.error) {
      throw new Error(response.error);
    }
    if (!response?.session || !isAuthFlowStep(response.session.step)) {
      throw new Error(fallbackError);
    }
    return response.session;
  };

  const startAuthFlowSession = async (stepName: AuthFlowStep = 'credentials', replace = true) => {
    const { data, error } = await supabase.functions.invoke('auth-flow-session', {
      body: {
        action: 'create',
        step: stepName,
        email: email || undefined,
        redirect,
        ref: refCode || undefined,
      },
    });
    if (error) throw error;

    const nextSession = readFlowResponse(data, 'Could not start a secure login session.');
    setFlowSessionId(nextSession.id);
    setFlowExpiresAt(nextSession.expiresAt);
    setStep(AUTH_STEP_TO_NUMBER[nextSession.step]);
    navigate(authFlowPath(nextSession.step, nextSession.id, queryString), { replace });
    return nextSession;
  };

  const ensureFlowSessionActive = async () => {
    if (!flowSessionId || !flowExpiresAt || new Date(flowExpiresAt).getTime() <= Date.now()) {
      await startAuthFlowSession('credentials', true);
      throw new Error(AUTH_FLOW_EXPIRED_MESSAGE);
    }
  };

  const goToAuthStep = async (
    nextStep: number,
    options: { email?: string; replace?: boolean } = {},
  ) => {
    const stepName = AUTH_NUMBER_TO_STEP[nextStep] ?? 'credentials';
    setStep(nextStep);

    if (!flowSessionId) {
      await startAuthFlowSession(stepName, options.replace ?? false);
      return;
    }

    const { data, error } = await supabase.functions.invoke('auth-flow-session', {
      body: {
        action: 'advance',
        id: flowSessionId,
        step: stepName,
        email: options.email || email || undefined,
        redirect,
        ref: refCode || undefined,
      },
    });
    if (error) throw error;

    const nextSession = readFlowResponse(data, 'Could not update the secure login session.');
    setFlowSessionId(nextSession.id);
    setFlowExpiresAt(nextSession.expiresAt);
    navigate(authFlowPath(nextSession.step, nextSession.id, queryString), { replace: options.replace ?? false });
  };

  const verifyCaptcha = async (token: string | null) => {
    if (!token) return { success: false };
    if (token.startsWith('wersee-v1-')) {
      return { success: true };
    }
    return await invokeApiRunner('verify-hcaptcha', { token });
  };

  const invokeAuthEmail2fa = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('auth-email-2fa', { body });
    const response = data as AuthEmail2faResponse | null;
    if (error) throw error;
    if (response?.error) throw new Error(response.error);
    if (!response?.success) throw new Error('Could not complete the Resend login code step.');
    return response;
  };

  const runPasswordLeakCheck = async (value: string) => {
    const requestId = ++passwordLeakRequestRef.current;
    setPasswordLeakStatus('checking');
    setPasswordLeakMessage(null);

    try {
      const pwned = await isPasswordPwned(value);
      if (requestId !== passwordLeakRequestRef.current) return false;

      if (pwned) {
        setPasswordLeakStatus('pwned');
        setPasswordLeakMessage(PWNED_PASSWORD_MESSAGE);
        return false;
      }

      setPasswordLeakStatus('safe');
      setPasswordLeakMessage('No known password leaks found.');
      return true;
    } catch {
      if (requestId !== passwordLeakRequestRef.current) return false;
      setPasswordLeakStatus('error');
      setPasswordLeakMessage(PWNED_PASSWORD_CHECK_ERROR);
      return false;
    }
  };

  useEffect(() => {
    let active = true;

    const initAuthFlow = async () => {
      if (session && !isAuthEmail2faPending()) {
        setFlowLoading(false);
        return;
      }

      setFlowLoading(true);
      try {
        if (!authSessionId) {
          await startAuthFlowSession('credentials', true);
          return;
        }

        const { data, error } = await supabase.functions.invoke('auth-flow-session', {
          body: {
            action: 'get',
            id: authSessionId,
          },
        });

        if (error) {
          await startAuthFlowSession('credentials', true);
          if (active) setError(AUTH_FLOW_EXPIRED_MESSAGE);
          return;
        }

        const nextSession = readFlowResponse(data, 'Could not load the secure login session.');
        if (!active) return;

        setFlowSessionId(nextSession.id);
        setFlowExpiresAt(nextSession.expiresAt);
        if (nextSession.email) {
          setEmail(nextSession.email);
          setTwoFactorEmail(nextSession.email);
        }
        setStep(AUTH_STEP_TO_NUMBER[nextSession.step]);

        if (authStep !== nextSession.step) {
          navigate(authFlowPath(nextSession.step, nextSession.id, queryString), { replace: true });
        }
      } catch (err: any) {
        if (!active) return;
        setError(err.message || 'Could not start the secure login session.');
      } finally {
        if (active) setFlowLoading(false);
      }
    };

    void initAuthFlow();

    return () => {
      active = false;
    };
  }, [authStep, authSessionId, session]);

  useEffect(() => {
    if (session && step !== 3 && !isAuthEmail2faPending()) {
      navigateAfterAuth();
    }
  }, [session, step]);

  // Step 3 redirect logic
  useEffect(() => {
    if (step === 3 || (showSuccess && session)) {
      const timer = setTimeout(() => {
        navigateAfterAuth();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, showSuccess, session]);

  // Cooldown timer logic
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (isLogin || !password) {
      passwordLeakRequestRef.current += 1;
      setPasswordLeakStatus('idle');
      setPasswordLeakMessage(null);
      return;
    }

    setPasswordLeakStatus('idle');
    setPasswordLeakMessage(null);

    const timer = window.setTimeout(() => {
      void runPasswordLeakCheck(password);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [isLogin, password]);

  if (session && !isAuthEmail2faPending()) return null;

  if (flowLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center text-white">
        <div className="flex items-center gap-3 text-sm font-semibold text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          Preparing secure login...
        </div>
      </div>
    );
  }

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    if (pass.length >= 12) strength += 1;
    return strength;
  };

  const strength = getPasswordStrength(password);
  const hasPasswordLeakWarning = !isLogin && (passwordLeakStatus === 'pwned' || passwordLeakStatus === 'error');
  const passwordLeakBlocksCredentialSubmit =
    !isLogin && Boolean(password) && (passwordLeakStatus === 'checking' || passwordLeakStatus === 'pwned');
  const passwordLeakBlocksAccountCreation = !isLogin && Boolean(password) && passwordLeakStatus !== 'safe';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cooldown > 0) return;

    // Step 1: Credentials
    if (step === 1) {
      if (!email || !password) {
        setError('Please enter your email and password.');
        return;
      }
      if (!isLogin && password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (!isLogin) {
        const passwordSafetyPassed = passwordLeakStatus === 'safe' || await runPasswordLeakCheck(password);
        if (!passwordSafetyPassed) {
          setError(null);
          return;
        }
      }
      try {
        await ensureFlowSessionActive();
        await goToAuthStep(2, { email });
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Could not continue the secure login session.');
      }
      return;
    }

    // Step 4: Email login code verification
    if (step === 4) {
      const normalizedCode = loginCode.replace(/\D/g, '');
      if (normalizedCode.length !== 6) {
        setError('Enter the 6-digit login code from your email.');
        return;
      }

      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        await ensureFlowSessionActive();
        await invokeAuthEmail2fa({ action: 'verify', code: normalizedCode });

        clearAuthEmail2faPending();
        await trackCurrentAuthDevice();
        setAttempts(0);
        await goToAuthStep(3, { replace: true });
        window.setTimeout(() => {
          window.location.assign(redirect);
        }, 800);
      } catch (err: any) {
        setError(err.message || 'Could not verify the login code.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Step 2: Captcha & Auth
    if (step === 2) {
      if (!isLogin && !termsAccepted) {
        setError('You must agree to the terms and conditions.');
        return;
      }

      if (!captchaToken) {
        setError('Please confirm you are not a robot.');
        return;
      }

      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        await ensureFlowSessionActive();
        // Verify hCaptcha token on backend, but allow local Wersee custom captcha tokens if the backend is unavailable.
        const verifyData = await verifyCaptcha(captchaToken);
        
        if (verifyData.error || !verifyData.success) {
          throw new Error('Verification failed. Please try again.');
        }

        if (isLogin) {
          setAuthEmail2faPending(email);
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) {
            clearAuthEmail2faPending();
            // Security: Increment attempts on failure
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            
            if (newAttempts >= 5) {
              setCooldown(30);
              setAttempts(0);
              await goToAuthStep(1, { replace: true }); // Go back to step 1 on cooldown
              throw new Error('Too many failed attempts. Please try again in 30 seconds.');
            }

            // Security: Generic error messages
            if (error.message.toLowerCase().includes('invalid login credentials') || 
                error.message.toLowerCase().includes('user not found') ||
                error.message.toLowerCase().includes('password')) {
              await goToAuthStep(1, { replace: true }); // Go back to step 1 on credential error
              throw new Error('Email or password is incorrect.');
            }
            throw error;
          }

          const challenge = await invokeAuthEmail2fa({ action: 'start' });
          
          setAttempts(0);
          setPassword('');
          setLoginCode('');
          setTwoFactorEmail(email);
          setMessage(`We sent a Resend login code to ${challenge.email || email}.`);
          await goToAuthStep(4, { email });
        } else {
          let referrerId = null;
          if (refCode) {
            const { data: referrer } = await supabase
              .from('profiles')
              .select('id')
              .or(`referral_code.eq.${refCode},id.ilike.${refCode}%`)
              .single();
            
            if (referrer) {
              referrerId = referrer.id;
            }
          }

          const passwordSafetyPassed = await runPasswordLeakCheck(password);
          if (!passwordSafetyPassed) {
            await goToAuthStep(1, { replace: true });
            setCaptchaToken(null);
            return;
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                referred_by: referrerId
              },
              emailRedirectTo: buildAppUrl('/confirm-email')
            }
          });
          if (error) throw error;
          
          if (data.session) {
            await goToAuthStep(3, { replace: true });
          } else {
            await goToAuthStep(3, { replace: true });
            setShowSuccess(true);
          }
        }
      } catch (err: any) {
        if (isLogin && step === 2) {
          clearAuthEmail2faPending();
          void supabase.auth.signOut();
        }
        setError(err.message);
        setCaptchaToken(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: buildAppUrl('/confirm-email')
        }
      });
      if (error) throw error;
      setMessage('New confirmation link sent!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-purple-600/10 rounded-full blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-10 md:p-14 text-center relative z-10"
        >
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Mail className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight mb-4">Check your email</h2>
          <p className="text-gray-500 text-lg mb-8 leading-relaxed">
            We have sent a confirmation link to <span className="font-semibold text-[#1D1D1F]">{email}</span>. Click the link in the email to activate your account.
          </p>

          {session ? (
            <div className="mb-8 flex items-center justify-center gap-3 text-emerald-600 font-semibold bg-emerald-50 py-3 px-6 rounded-2xl animate-pulse">
              <CheckCircle2 className="w-5 h-5" />
              Email confirmed! Redirecting...
            </div>
          ) : (
            <div className="mb-8 flex items-center justify-center gap-3 text-indigo-600 font-medium bg-indigo-50 py-3 px-6 rounded-2xl">
              <Loader2 className="w-5 h-5 animate-spin" />
              Waiting for confirmation...
            </div>
          )}
          
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-medium"
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <button 
              onClick={() => {
                setShowSuccess(false);
                void goToAuthStep(1, { replace: true });
              }}
              className="w-full py-4 bg-[#1D1D1F] text-white rounded-2xl font-bold text-lg hover:bg-black transition-all"
            >
              Back to login
            </button>
            <p className="text-sm text-gray-400">
              Didn't receive an email? Check your spam folder or{' '}
              <button 
                onClick={handleResendEmail} 
                disabled={loading}
                className="text-indigo-600 font-semibold hover:underline disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'try again'}
              </button>.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setLoading(true);

      const cleanRedirect = redirect && redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : '';
      const redirectUrl = buildAppUrl(`/auth/callback${cleanRedirect}`);

      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      }) as any;

      const { data, error } = result;
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch (error: any) {
      setError(error.message || 'Could not start Google sign-in.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (passkeyLoading || loading) return;

    if (!passkeysSupported) {
      setMessage('Passkeys vereisen een moderne browser en een beveiligde HTTPS-verbinding. Localhost blijft werken voor development.');
      return;
    }

    try {
      setPasskeyLoading(true);
      setError(null);
      setMessage(null);

      const { data, error } = await supabase.auth.signInWithPasskey();

      if (error) throw error;
      if (data?.session) {
        navigateAfterAuth();
      }
    } catch (error: unknown) {
      const passkeyMessage = getPasskeyErrorMessage(error);
      if (isPasskeyCancellation(error)) {
        setMessage(passkeyMessage);
      } else {
        setError(passkeyMessage);
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleResendLoginCode = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const challenge = await invokeAuthEmail2fa({ action: 'start' });
      setLoginCode('');
      setTwoFactorEmail(twoFactorEmail || email);
      setMessage(`A new Resend login code has been sent to ${challenge.email || twoFactorEmail || email}.`);
    } catch (err: any) {
      setError(err.message || 'Could not send a new Resend login code.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkLogin = async () => {
    if (!email) {
      setError('Enter your email address first.');
      return;
    }

    try {
      setMagicLinkLoading(true);
      setError(null);
      setMessage(null);
      await ensureFlowSessionActive();

      const cleanRedirect = redirect && redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : '';
      const redirectUrl = buildAppUrl(`/auth/callback${cleanRedirect}`);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      setMessage('Magic link sent. Open the email on this device to continue.');
    } catch (err: any) {
      setError(err.message || 'Could not send a magic link.');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleWeb3SignIn = async (chain: 'ethereum' | 'solana') => {
    try {
      setLoading(true);
      setError(null);
      
      const options: any = {
        chain,
        statement: 'I accept the Terms of Service at https://wersee.com/tos',
      };

      if (chain === 'solana') {
        const solanaWallet = (window as any).solana;
        if (!solanaWallet) {
          throw new Error('Solana wallet not found. Please install a Solana wallet like Phantom.');
        }
        
        // Connect the wallet
        await solanaWallet.connect();
        options.wallet = solanaWallet;
      } else if (chain === 'ethereum') {
        const ethereumWallet = (window as any).ethereum;
        if (!ethereumWallet) {
          throw new Error('Ethereum wallet not found. Please install an Ethereum wallet like MetaMask.');
        }
        
        // Request account access
        await ethereumWallet.request({ method: 'eth_requestAccounts' });
        options.wallet = ethereumWallet;
      }
      
      const result = await supabase.auth.signInWithWeb3(options) as any;
      const { data, error } = result;
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      navigate(redirect);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <SEO title="Sign In" noIndex />
    <div className="min-h-[100dvh] bg-[#050505] flex flex-col lg:flex-row overflow-hidden selection:bg-indigo-500/30">
      {/* Left Side - Visual/Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex lg:w-[45%] bg-[#050505] relative flex-col justify-between p-16 overflow-hidden border-r border-white/5"
      >
        {/* Atmospheric Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[30%] left-[20%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 text-white/40 hover:text-white transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
            <span className="text-sm font-semibold tracking-wide uppercase">Back to Wersee</span>
          </button>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Platform v2.0</span>
              </div>
              <h2 className="text-6xl font-bold text-white leading-[1.05] tracking-tight">
                The future of <br />
                <span className="text-indigo-400">
                  digital commerce.
                </span>
              </h2>
            </div>
            
            <p className="text-xl text-gray-400 leading-relaxed max-w-md font-light">
              Join thousands of creators and entrepreneurs turning their passion into profit on Wersee.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:bg-white/10 transition-all">
                  <Sparkles className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Premium Tools</h3>
                  <p className="text-sm text-gray-500">Everything you need to grow.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:bg-white/10 transition-all">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Secure & Reliable</h3>
                  <p className="text-sm text-gray-500">Full buyer and seller protection.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
          <span>&copy; {new Date().getFullYear()} Wersee Inc.</span>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <span>Privacy Policy</span>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <span>Terms of Service</span>
        </div>
      </motion.div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#0A0A0A] relative overflow-hidden">
        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] space-y-10 relative z-10"
        >
          {/* Mobile Back Button */}
          <button onClick={() => navigate('/')} className="lg:hidden flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to home
          </button>

          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20"
            >
              <img 
                src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/a1e58d3a96480df827eafe98567353d2-removebg-preview.png" 
                alt="Logo" 
                className="w-8 h-8 object-contain brightness-0 invert"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1-header"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <h1 className="text-4xl font-bold text-white tracking-tight">
                    {isLogin ? 'Welcome back' : 'Create account'}
                  </h1>
                  <p className="text-gray-400 text-lg font-light">
                    {isLogin ? 'Log in to your account to continue.' : 'Join the community and start creating.'}
                  </p>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div
                  key="step2-header"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <h1 className="text-4xl font-bold text-white tracking-tight">
                    Security Check
                  </h1>
                  <p className="text-gray-400 text-lg font-light">
                    Please confirm you are not a robot to proceed.
                  </p>
                </motion.div>
              )}
              {step === 3 && (
                <motion.div
                  key="step3-header"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3 text-center py-8"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h1 className="text-4xl font-bold text-white tracking-tight">
                    Success!
                  </h1>
                  <p className="text-gray-400 text-lg font-light">
                    Authentication successful. Redirecting you...
                  </p>
                </motion.div>
              )}
              {step === 4 && (
                <motion.div
                  key="step4-header"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <h1 className="text-4xl font-bold text-white tracking-tight">
                    Check your email
                  </h1>
                  <p className="text-gray-400 text-lg font-light">
                    Enter the Resend login code we sent to {twoFactorEmail || email}.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-start gap-3 backdrop-blur-md"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}

            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-sm flex items-start gap-3 backdrop-blur-md"
              >
                <Sparkles className="w-5 h-5 shrink-0" />
                <p className="font-medium">{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step !== 3 && (
              <motion.div
                key="auth-form-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <form onSubmit={handleAuth} className="space-y-6">
                  <AnimatePresence mode="wait">
                    {step === 1 ? (
                      <motion.div
                        key="step1-fields"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-5"
                      >
                        {isLogin && (
                          <div className="space-y-3">
                            <button
                              type="button"
                              onClick={handlePasskeyLogin}
                              disabled={passkeyLoading || loading || !passkeysSupported}
                              className="w-full min-h-12 bg-white text-black py-4 rounded-2xl font-bold text-base hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Inloggen met een passkey"
                            >
                              {passkeyLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Fingerprint className="w-5 h-5" />
                              )}
                              {passkeyLoading ? 'Passkey controleren…' : 'Inloggen met een passkey'}
                            </button>
                            {!passkeysSupported && (
                              <p className="text-xs text-gray-500 leading-relaxed px-1">
                                Passkeys vereisen een moderne browser en een beveiligde HTTPS-verbinding. Localhost blijft werken voor development.
                              </p>
                            )}
                            <div className="relative flex items-center py-1">
                              <div className="flex-grow border-t border-white/5"></div>
                              <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Or use email</span>
                              <div className="flex-grow border-t border-white/5"></div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:bg-white/10 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                              placeholder="name@example.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Password</label>
                            {isLogin && (
                              <button 
                                type="button" 
                                onClick={() => navigate('/forgot-password')} 
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
                              >
                                Forgot?
                              </button>
                            )}
                          </div>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              aria-invalid={hasPasswordLeakWarning}
                              aria-describedby={!isLogin && passwordLeakMessage ? 'password-leak-status' : undefined}
                              className={`w-full pl-12 ${hasPasswordLeakWarning ? 'pr-20 border-red-500/70 focus:border-red-500/80 focus:ring-red-500/10' : 'pr-12 border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/10'} py-4 rounded-2xl bg-white/5 border text-white placeholder:text-gray-600 focus:bg-white/10 focus:ring-4 transition-all outline-none`}
                              placeholder="••••••••"
                            />
                            {hasPasswordLeakWarning && (
                              <AlertCircle className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" aria-hidden="true" />
                            )}
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>

                          {!isLogin && password && passwordLeakStatus !== 'idle' && (
                            <div
                              id="password-leak-status"
                              role={hasPasswordLeakWarning ? 'alert' : 'status'}
                              className={`flex items-center gap-2 px-1 text-xs font-medium ${
                                passwordLeakStatus === 'safe'
                                  ? 'text-emerald-400'
                                  : passwordLeakStatus === 'checking'
                                    ? 'text-gray-400'
                                    : 'text-red-400'
                              }`}
                            >
                              {passwordLeakStatus === 'checking' ? (
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                              ) : passwordLeakStatus === 'safe' ? (
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 shrink-0" />
                              )}
                              <span>
                                {passwordLeakStatus === 'checking'
                                  ? 'Checking password leak database...'
                                  : passwordLeakMessage}
                                {passwordLeakStatus === 'pwned' && (
                                  <>
                                    {' '}
                                    <Link
                                      to="/account-security"
                                      className="underline underline-offset-2 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400/40 rounded-sm"
                                    >
                                      Learn more
                                    </Link>
                                  </>
                                )}
                              </span>
                            </div>
                          )}
                          
                          {!isLogin && password && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 space-y-3 px-1"
                            >
                              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-gray-500">
                                <span>Security Level</span>
                                <span className={
                                  strength <= 1 ? 'text-red-400' : 
                                  strength === 2 ? 'text-amber-400' : 
                                  strength === 3 ? 'text-blue-400' : 'text-emerald-400'
                                }>
                                  {strength <= 1 ? 'Weak' : strength === 2 ? 'Medium' : strength === 3 ? 'Strong' : 'Exceptional'}
                                </span>
                              </div>
                              <div className="flex gap-1.5 h-1">
                                {[1, 2, 3, 4].map((i) => (
                                  <div 
                                    key={i}
                                    className={`flex-1 rounded-full transition-all duration-500 ${
                                      i <= strength 
                                        ? (strength <= 1 ? 'bg-red-500' : strength === 2 ? 'bg-amber-500' : strength === 3 ? 'bg-blue-500' : 'bg-emerald-500')
                                        : 'bg-white/5'
                                    }`}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {isLogin && (
                            <button
                              type="button"
                              onClick={handleMagicLinkLogin}
                              disabled={magicLinkLoading || loading}
                              className="w-full py-3 rounded-2xl border border-white/10 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {magicLinkLoading ? 'Sending magic link...' : 'Email me a magic link'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ) : step === 4 ? (
                      <motion.div
                        key="step4-fields"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Login Code</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            required
                            maxLength={6}
                            value={loginCode}
                            onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-5 py-5 rounded-2xl bg-white/5 border border-white/10 text-white text-center text-3xl font-bold tracking-[0.35em] placeholder:tracking-normal placeholder:text-base placeholder:font-normal placeholder:text-gray-600 focus:bg-white/10 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                            placeholder="000000"
                          />
                          <p className="text-xs text-gray-500 leading-relaxed px-1">
                            Keep this page open while you check your inbox. Use the 6-digit code from the Resend email.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={handleResendLoginCode}
                            disabled={loading}
                            className="w-full py-3 rounded-2xl border border-white/10 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                          >
                            Resend code
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              clearAuthEmail2faPending();
                              await supabase.auth.signOut();
                              await goToAuthStep(1, { replace: true });
                              setLoginCode('');
                              setCaptchaToken(null);
                              setMessage(null);
                              setError(null);
                            }}
                            className="w-full py-3 rounded-2xl border border-white/10 text-sm font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="step2-fields"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex justify-center py-4">
                          <WerseeCaptcha
                            onVerify={(token) => setCaptchaToken(token)}
                            onExpire={() => setCaptchaToken(null)}
                          />
                        </div>

                        {!isLogin && (
                          <div className="flex items-start gap-3 px-1">
                            <div className="relative flex items-center mt-1">
                              <input
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="peer w-5 h-5 rounded-lg border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none checked:bg-indigo-600 checked:border-transparent"
                              />
                              <CheckCircle2 className="absolute w-5 h-5 text-white scale-0 peer-checked:scale-75 transition-transform pointer-events-none" />
                            </div>
                            <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
                              I agree to the{' '}
                              <a href="/terms" target="_blank" className="text-indigo-400 hover:text-indigo-300 transition-colors">terms and conditions</a>
                              {' '}and the{' '}
                              <a href="/privacy-policy" target="_blank" className="text-indigo-400 hover:text-indigo-300 transition-colors">privacy policy</a>.
                            </label>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            void goToAuthStep(1, { replace: true });
                            setError(null);
                          }}
                          className="w-full text-center text-sm font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
                        >
                          Back to credentials
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      (step === 1 && passwordLeakBlocksCredentialSubmit) ||
                      (step === 2 && !isLogin && (passwordLeakBlocksAccountCreation || !termsAccepted)) ||
                      (step === 4 && loginCode.length !== 6) ||
                      cooldown > 0
                    }
                    className="w-full relative group overflow-hidden py-4 bg-white text-black rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : cooldown > 0 ? (
                        <>Try again in {cooldown}s <Lock className="w-4 h-4" /></>
                      ) : (
                        <>
                          {step === 1 ? 'Continue' : step === 4 ? 'Verify Code' : (isLogin ? 'Send Resend Code' : 'Create account')}
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>
                </form>

                {step === 1 && (
                  <div className="mt-10 space-y-6">
                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-white/5"></div>
                      <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Secure Social Login</span>
                      <div className="flex-grow border-t border-white/5"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-semibold hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 group"
                      >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleWeb3SignIn('ethereum')}
                          className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-semibold hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                        >
                          Ethereum
                        </button>
                        <button
                          onClick={() => handleWeb3SignIn('solana')}
                          className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-semibold hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                        >
                          Solana
                        </button>
                      </div>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                      {isLogin ? "Don't have an account?" : "Already have an account?"}
                      <button
                        onClick={() => {
                          setIsLogin(!isLogin);
                          setError(null);
                          setCaptchaToken(null);
                        }}
                        className="ml-2 font-bold text-white hover:text-indigo-400 transition-colors"
                      >
                        {isLogin ? 'Sign up now' : 'Log in instead'}
                      </button>
                    </p>

                    <div className="pt-6 border-t border-white/5 text-center">
                      <p className="text-sm text-gray-500 mb-3">Creating an account for a minor?</p>
                      <button
                        onClick={() => navigate('/next-gen-setup')}
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        Set up a Next Gen Creator Account
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
    </>
  );
};
