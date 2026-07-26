import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Loader2, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';

type Invitation = {
  recipientName: string;
  recipientEmail: string;
  amountMinor: number;
  currency: string;
  status: string;
  ready: boolean;
};

const formatMoney = (amountMinor: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountMinor / 100);

export const PayoutRecipientSetup: React.FC = () => {
  const { token = '' } = useParams();
  const location = useLocation();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inspect = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data, error: invokeError }, { data: authData }] = await Promise.all([
        supabase.functions.invoke('payout-recipient-onboarding', {
          body: { action: 'inspect', token },
        }),
        supabase.auth.getUser(),
      ]);
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setInvitation(data);
      setSignedIn(Boolean(authData.user));
    } catch (inspectError: any) {
      setError(inspectError.message || 'This payout invitation is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void inspect();
  }, [token, location.search]);

  const startOnboarding = async () => {
    setStarting(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('payout-recipient-onboarding', {
        body: {
          action: 'start',
          token,
          returnOrigin: window.location.origin,
        },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      if (data?.ready) {
        await inspect();
        return;
      }
      if (!data?.onboardingUrl) throw new Error('Stripe onboarding could not be opened.');
      window.location.assign(data.onboardingUrl);
    } catch (startError: any) {
      setError(startError.message || 'Payout setup could not start.');
    } finally {
      setStarting(false);
    }
  };

  const redirectPath = `${location.pathname}${location.search}`;
  const authUrl = `/auth?mode=signup&redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-10 text-white sm:px-6">
      <SEO title="Secure payout setup | Wersee" description="Set up a Stripe-verified payout destination for a Wersee payout." />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-12rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-violet-600/15 blur-[120px]" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative mx-auto mt-[5vh] w-full max-w-xl overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/60 backdrop-blur-2xl"
      >
        <div className="border-b border-white/10 p-7 sm:p-9">
          <div className="mb-7 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
              <WalletCards className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
              <LockKeyhole className="h-3.5 w-3.5" /> Private invitation
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/35">Wersee payout</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Receive money securely.</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/50">
            Wersee checks your account first. Stripe collects and verifies the payout details; your full bank account number is never stored by Wersee.
          </p>
        </div>

        <div className="space-y-5 p-7 sm:p-9">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-white/45" /></div>
          ) : error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm leading-6 text-red-100">{error}</div>
          ) : invitation ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-wider text-white/30">Recipient</p>
                  <p className="mt-2 font-semibold">{invitation.recipientName}</p>
                  <p className="mt-1 text-xs text-white/40">{invitation.recipientEmail}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-wider text-white/30">Payout</p>
                  <p className="mt-2 text-xl font-semibold">{formatMoney(invitation.amountMinor, invitation.currency)}</p>
                  <p className="mt-1 text-xs capitalize text-white/40">{invitation.status.replaceAll('_', ' ')}</p>
                </div>
              </div>

              {invitation.ready ? (
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" />
                  <h2 className="mt-4 text-xl font-semibold">Payout account ready</h2>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/65">Wersee has confirmed your Stripe payout account. No additional bank details are needed here.</p>
                </div>
              ) : signedIn ? (
                <button onClick={startOnboarding} disabled={starting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-bold text-black transition hover:bg-white/90 disabled:opacity-50">
                  {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  {starting ? 'Checking account…' : 'Check account and continue with Stripe'}
                  {!starting && <ArrowRight className="h-4 w-4" />}
                </button>
              ) : (
                <Link to={authUrl} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-bold text-black transition hover:bg-white/90">
                  Sign in or create an account <ArrowRight className="h-4 w-4" />
                </Link>
              )}

              <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs leading-5 text-white/45">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                This invitation expires automatically. Only sign in with the email address that received the invitation.
              </div>
            </>
          ) : null}
        </div>
      </motion.section>
    </main>
  );
};
