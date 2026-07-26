import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowRightLeft, Banknote, CheckCircle2, Clock, Coins, Copy, Download,
  ExternalLink, Loader2, Mail, Plus, RefreshCcw, Search, Settings, ShieldCheck,
  UserRoundPlus, WalletCards, X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { PayoutScheduleModal } from '../dashboard/PayoutScheduleModal';
import { appToast } from '@/lib/feedback';

type StripePayout = {
  id: string;
  amount: number;
  currency: string;
  arrival_date?: number | null;
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
  created: number;
  description?: string | null;
};

type PayoutRequest = {
  id: string;
  amount_minor: number;
  currency: string;
  status: string;
  payout_kind: string;
  estimated_arrival_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  payout_recipients?: { name?: string; email?: string } | null;
};

type DisplayPayout = {
  id: string;
  amountMinor: number;
  currency: string;
  status: string;
  createdAt: string;
  arrivalAt?: string | null;
  deliveredAt?: string | null;
  recipient: string;
  description: string;
};

type PayoutCheckPhase = 'idle' | 'checking' | 'eligible' | 'insufficient' | 'paying' | 'success' | 'error';

type PayoutBalanceCheck = {
  eligible: boolean;
  amountMinor: number;
  availableMinor: number;
  pendingMinor: number;
  shortfallMinor: number;
  currency: string;
};

const formatMoney = (amountMinor: number, currency = 'eur') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountMinor / 100);

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const MoneyPayoutsView: React.FC = () => {
  const [rows, setRows] = useState<DisplayPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [ownModal, setOwnModal] = useState(false);
  const [otherModal, setOtherModal] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payoutPhase, setPayoutPhase] = useState<PayoutCheckPhase>('idle');
  const [balanceCheck, setBalanceCheck] = useState<PayoutBalanceCheck | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [otherStep, setOtherStep] = useState(1);
  const [recipient, setRecipient] = useState({ name: '', email: '', amount: '', accepted: false });
  const [recipientInvite, setRecipientInvite] = useState<{ url: string; expiresAt?: string | null } | null>(null);

  const fetchPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');
      setUserId(user.id);
      const { data, error: invokeError } = await supabase.functions.invoke('finance-api', {
        body: { action: 'list-payouts' },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setAccount(data.account);

      const stripeRows = ((data.stripePayouts || []) as StripePayout[]).map((payout): DisplayPayout => ({
        id: payout.id,
        amountMinor: payout.amount,
        currency: payout.currency,
        status: payout.status,
        createdAt: new Date(payout.created * 1000).toISOString(),
        arrivalAt: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
        deliveredAt: payout.status === 'paid' && payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
        recipient: 'Your connected Stripe bank account',
        description: payout.description || 'Stripe Connect payout',
      }));
      const requestRows = ((data.requests || []) as PayoutRequest[])
        .filter((request) => request.payout_kind === 'other_recipient')
        .map((request): DisplayPayout => ({
          id: request.id,
          amountMinor: request.amount_minor,
          currency: request.currency,
          status: request.status,
          createdAt: request.created_at,
          arrivalAt: request.estimated_arrival_at,
          deliveredAt: request.delivered_at,
          recipient: request.payout_recipients?.name || request.payout_recipients?.email || 'Recipient',
          description: 'Payout to another Stripe-verified recipient',
        }));
      setRows([...stripeRows, ...requestRows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
    } catch (fetchError: any) {
      setError(fetchError.message || 'Payouts could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const filtered = useMemo(() => rows.filter((row) => {
    const query = search.toLowerCase();
    return (status === 'all' || row.status === status)
      && (!query || `${row.id} ${row.recipient} ${row.description}`.toLowerCase().includes(query));
  }), [rows, search, status]);

  const paid = rows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + row.amountMinor, 0);
  const pending = rows.filter((row) => ['pending', 'processing', 'in_transit', 'recipient_onboarding'].includes(row.status))
    .reduce((sum, row) => sum + row.amountMinor, 0);

  const requireConnectedPayoutAccount = () => {
    if (account?.connected && account?.payoutsEnabled && account?.detailsSubmitted) return true;
    appToast('Complete Stripe Connect before paying out. Stripe verification replaces separate Wersee KYC.');
    return false;
  };

  const amountMinor = Math.round(Number(amount) * 100);
  const payoutBusy = payoutPhase === 'checking' || payoutPhase === 'paying';

  const resetOwnPayout = () => {
    setAmount('');
    setPayoutPhase('idle');
    setBalanceCheck(null);
    setPayoutError(null);
  };

  const closeOwnPayout = () => {
    if (payoutBusy) return;
    setOwnModal(false);
    resetOwnPayout();
  };

  const readFunctionError = async (invokeError: any, fallback: string) => {
    try {
      const response = invokeError?.context;
      if (response && typeof response.clone === 'function') {
        const payload = await response.clone().json();
        return payload?.error || fallback;
      }
    } catch {
      // Use the safe fallback instead of exposing raw provider errors.
    }
    return fallback;
  };

  const checkOwnPayout = async () => {
    if (!requireConnectedPayoutAccount()) return;
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 100) {
      setPayoutError('Enter an amount of at least €1.00.');
      setPayoutPhase('error');
      return;
    }

    setPayoutPhase('checking');
    setBalanceCheck(null);
    setPayoutError(null);
    try {
      const minimumAnimation = new Promise((resolve) => window.setTimeout(resolve, 900));
      const invoke = supabase.functions.invoke('finance-api', {
        body: { action: 'check-own-payout', amountMinor, currency: 'eur' },
      });
      const [{ data, error: invokeError }] = await Promise.all([invoke, minimumAnimation]);
      if (invokeError) {
        setPayoutError(await readFunctionError(invokeError, 'The available balance could not be checked.'));
        setPayoutPhase('error');
        return;
      }
      if (data?.error) {
        setPayoutError(data.error);
        setPayoutPhase('error');
        return;
      }

      const snapshot = data as PayoutBalanceCheck;
      setBalanceCheck(snapshot);
      setPayoutPhase(snapshot.eligible ? 'eligible' : 'insufficient');
    } catch {
      setPayoutError('The available balance could not be checked.');
      setPayoutPhase('error');
    }
  };

  const createOwnPayout = async () => {
    if (!requireConnectedPayoutAccount() || payoutPhase !== 'eligible' || !balanceCheck) return;
    setSubmitting(true);
    setPayoutPhase('paying');
    setPayoutError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('finance-api', {
        body: {
          action: 'create-own-payout',
          amountMinor: balanceCheck.amountMinor,
          currency: balanceCheck.currency,
        },
      });
      if (invokeError) {
        throw new Error(await readFunctionError(invokeError, 'Stripe could not complete this payout.'));
      }
      if (data?.error) throw new Error(data.error);
      setPayoutPhase('success');
      appToast('Payout requested through Stripe.');
      await fetchPayouts();
    } catch (submitError: any) {
      setBalanceCheck(null);
      setPayoutError(submitError.message || 'Payout failed');
      setPayoutPhase('error');
    } finally {
      setSubmitting(false);
    }
  };

  const prepareOtherPayout = async () => {
    setSubmitting(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('finance-api', {
        body: {
          action: 'prepare-other-recipient',
          name: recipient.name,
          email: recipient.email,
          amount: Number(recipient.amount),
          currency: 'eur',
          responsibilityAccepted: recipient.accepted,
          returnOrigin: window.location.origin,
        },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      if (data?.recipientReady) {
        appToast('Existing Wersee/Stripe payout account found. The request is ready for processing.');
        setOtherModal(false);
        setRecipient({ name: '', email: '', amount: '', accepted: false });
        await fetchPayouts();
        return;
      }
      if (!data?.inviteUrl) throw new Error('Recipient invitation link was not returned.');
      setRecipientInvite({ url: data.inviteUrl, expiresAt: data.inviteExpiresAt });
      setOtherStep(3);
      await fetchPayouts();
    } catch (submitError: any) {
      appToast(submitError.message || 'Recipient onboarding could not start');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCsv = () => {
    const lines = [
      ['id', 'recipient', 'amount', 'currency', 'status', 'created', 'expected_arrival', 'delivered'].map(csvCell).join(','),
      ...filtered.map((row) => [
        row.id, row.recipient, (row.amountMinor / 100).toFixed(2), row.currency.toUpperCase(),
        row.status, row.createdAt, row.arrivalAt || '', row.deliveredAt || '',
      ].map(csvCell).join(',')),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `wersee-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const statusClass = (value: string) => value === 'paid'
    ? 'bg-emerald-500/10 text-emerald-300'
    : ['failed', 'canceled'].includes(value)
      ? 'bg-red-500/10 text-red-300'
      : 'bg-amber-500/10 text-amber-300';

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Payouts</h1>
          <p className="mt-1 text-sm text-white/45">Only Stripe-confirmed payouts and Wersee-approved recipient requests.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchPayouts} aria-label="Refresh payouts" className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/60 hover:text-white">
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setOtherStep(1); setRecipientInvite(null); setOtherModal(true); }} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10">
            <UserRoundPlus className="h-4 w-4" /> Pay out other
          </button>
          <button onClick={() => { if (requireConnectedPayoutAccount()) { resetOwnPayout(); setOwnModal(true); } }} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black hover:bg-white/90">
            <Plus className="h-4 w-4" /> Manual payout
          </button>
        </div>
      </header>

      {!account?.connected && !loading && (
        <div className="flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>You can receive Wersee Points without Stripe. To cash out, connect Stripe once; its onboarding is the required payout verification, so no second Wersee KYC is needed.</p>
        </div>
      )}
      {error && <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total paid out" value={formatMoney(paid)} />
        <Stat label="Pending payouts" value={formatMoney(pending)} />
        <div className="rounded-3xl border border-white/5 bg-[#141414] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/40">Next payout</span>
            <button onClick={() => requireConnectedPayoutAccount() && setScheduleModal(true)} aria-label="Open payout schedule settings" className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white">
              <Settings className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">Weekly</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#141414] p-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, person or description" className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-white/20" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Payout status" className="rounded-xl border border-white/5 bg-[#1b1b1b] px-4 py-3 text-sm text-white">
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="in_transit">In transit</option>
          <option value="recipient_onboarding">Recipient onboarding</option>
          <option value="failed">Failed</option>
          <option value="canceled">Canceled</option>
        </select>
        <button onClick={downloadCsv} disabled={!filtered.length} className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-bold text-white disabled:opacity-30">
          <Download className="h-4 w-4" /> Download
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#141414]">
        {loading ? (
          <div className="flex h-48 items-center justify-center"><RefreshCcw className="h-6 w-6 animate-spin text-white/40" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <ArrowRightLeft className="mb-3 h-8 w-8 text-white/20" />
            <p className="font-bold text-white">No payouts found</p>
            <p className="text-sm text-white/35">No real Stripe payout matches this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((row) => {
              const arrival = row.arrivalAt ? new Date(row.arrivalAt) : null;
              const days = arrival ? Math.max(0, Math.ceil((+arrival - Date.now()) / 86_400_000)) : null;
              return (
                <div key={row.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center md:p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-white">{formatMoney(row.amountMinor, row.currency)}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${statusClass(row.status)}`}>{row.status.replaceAll('_', ' ')}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-white/55">{row.recipient} · {row.description}</p>
                    <p className="mt-1 text-xs text-white/30">{row.id}</p>
                  </div>
                  <div className="text-left text-xs sm:text-right">
                    {row.deliveredAt ? (
                      <p className="flex items-center gap-1.5 text-emerald-300 sm:justify-end"><CheckCircle2 className="h-4 w-4" /> Delivered {new Date(row.deliveredAt).toLocaleDateString()}</p>
                    ) : arrival ? (
                      <p className="flex items-center gap-1.5 text-white/55 sm:justify-end"><Clock className="h-4 w-4" /> {days === 0 ? 'Expected today' : `Expected in ${days} day${days === 1 ? '' : 's'}`}</p>
                    ) : (
                      <p className="text-white/30">Arrival available after Stripe confirmation</p>
                    )}
                    <p className="mt-1 text-white/25">Created {new Date(row.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SimpleModal open={ownModal} onClose={closeOwnPayout} title="Manual payout" subtitle="A live Stripe check runs before any money can move.">
        <PayoutBalanceAnimation phase={payoutPhase} />

        {payoutPhase !== 'success' && (
          <MoneyInput
            value={amount}
            disabled={payoutBusy || payoutPhase === 'eligible'}
            onChange={(nextAmount) => {
              setAmount(nextAmount);
              setPayoutPhase('idle');
              setBalanceCheck(null);
              setPayoutError(null);
            }}
          />
        )}

        {balanceCheck && payoutPhase !== 'checking' && (
          <div className={`rounded-2xl border p-4 ${balanceCheck.eligible ? 'border-emerald-300/20 bg-emerald-300/10' : 'border-amber-300/20 bg-amber-300/10'}`}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-white/55">Available now</span>
              <strong className={balanceCheck.eligible ? 'text-emerald-200' : 'text-amber-100'}>
                {formatMoney(balanceCheck.availableMinor, balanceCheck.currency)}
              </strong>
            </div>
            {balanceCheck.pendingMinor > 0 && (
              <div className="mt-2 flex items-center justify-between gap-4 text-xs">
                <span className="text-white/35">Still pending at Stripe</span>
                <span className="text-white/55">{formatMoney(balanceCheck.pendingMinor, balanceCheck.currency)}</span>
              </div>
            )}
            {!balanceCheck.eligible && (
              <p className="mt-3 text-sm leading-5 text-amber-100/75">
                You need {formatMoney(balanceCheck.shortfallMinor, balanceCheck.currency)} more available balance for this payout.
              </p>
            )}
          </div>
        )}

        {payoutError && (
          <div role="alert" className="flex gap-3 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{payoutError}</span>
          </div>
        )}

        {payoutPhase === 'success' ? (
          <button onClick={closeOwnPayout} className="w-full rounded-2xl bg-white py-4 font-bold text-black">Done</button>
        ) : payoutPhase === 'eligible' ? (
          <div className="space-y-3">
            <button onClick={createOwnPayout} disabled={submitting} className="w-full rounded-2xl bg-emerald-300 py-4 font-bold text-emerald-950 disabled:opacity-40">
              Confirm {formatMoney(balanceCheck?.amountMinor || 0, balanceCheck?.currency || 'eur')} payout
            </button>
            <button onClick={() => { setPayoutPhase('idle'); setBalanceCheck(null); }} className="w-full py-2 text-sm font-semibold text-white/40 hover:text-white">Change amount</button>
          </div>
        ) : (
          <button onClick={checkOwnPayout} disabled={payoutBusy || !Number.isSafeInteger(amountMinor) || amountMinor < 100} className="w-full rounded-2xl bg-white py-4 font-bold text-black disabled:opacity-40">
            <span className="flex items-center justify-center gap-2">
              {payoutPhase === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {payoutPhase === 'checking' ? 'Checking live Stripe balance…' : payoutPhase === 'insufficient' ? 'Check again' : 'Check available balance'}
            </span>
          </button>
        )}
      </SimpleModal>

      <SimpleModal open={otherModal} onClose={() => setOtherModal(false)} title="Pay out other" subtitle={otherStep === 1 ? 'First, Wersee checks whether this recipient already has a payout account.' : otherStep === 2 ? 'Responsibility and account verification.' : 'Send the private setup link to the recipient.'}>
        {otherStep === 1 ? (
          <>
            <Field label="Recipient name" value={recipient.name} onChange={(name) => setRecipient({ ...recipient, name })} />
            <Field label="Recipient email" type="email" value={recipient.email} onChange={(email) => setRecipient({ ...recipient, email })} />
            <MoneyInput value={recipient.amount} onChange={(otherAmount) => setRecipient({ ...recipient, amount: otherAmount })} />
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
              Bank account / IBAN is entered on Stripe’s hosted form. Wersee never stores the full account number.
            </div>
            <button onClick={() => setOtherStep(2)} disabled={!recipient.name.trim() || !recipient.email.includes('@') || Number(recipient.amount) < 1} className="w-full rounded-2xl bg-white py-4 font-bold text-black disabled:opacity-40">Continue</button>
          </>
        ) : otherStep === 2 ? (
          <>
            <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-6 text-amber-50">
              The recipient is responsible for their own taxes, legal obligations and use of the received funds. Stripe must verify that recipient and their bank account before Wersee can make a transfer.
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 p-4 text-sm text-white/65">
              <input type="checkbox" checked={recipient.accepted} onChange={(event) => setRecipient({ ...recipient, accepted: event.target.checked })} className="mt-1" />
              I understand this responsibility statement and confirm the recipient details are correct.
            </label>
            <div className="flex gap-3">
              <button onClick={() => setOtherStep(1)} className="flex-1 rounded-2xl bg-white/5 py-4 font-bold text-white">Back</button>
              <button onClick={prepareOtherPayout} disabled={!recipient.accepted || submitting} className="flex-[2] rounded-2xl bg-white py-4 font-bold text-black disabled:opacity-40">
                <span className="flex items-center justify-center gap-2">{submitting ? 'Checking account…' : 'Check recipient'} <ExternalLink className="h-4 w-4" /></span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-3xl border border-blue-300/20 bg-blue-300/10 p-5">
              <CheckCircle2 className="h-8 w-8 text-blue-200" />
              <h3 className="mt-4 text-lg font-bold text-white">Private setup link created</h3>
              <p className="mt-2 text-sm leading-6 text-blue-50/65">
                No ready payout account was found. Send this link to {recipient.name}; only the invited email address can claim it and enter details through Stripe.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="break-all font-mono text-xs leading-5 text-white/65">{recipientInvite?.url}</p>
              {recipientInvite?.expiresAt && <p className="mt-2 text-xs text-white/30">Expires {new Date(recipientInvite.expiresAt).toLocaleString()}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={async () => {
                  if (!recipientInvite?.url) return;
                  await navigator.clipboard.writeText(recipientInvite.url);
                  appToast('Invitation link copied.');
                }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-black"
              >
                <Copy className="h-4 w-4" /> Copy link
              </button>
              <a
                href={`mailto:${encodeURIComponent(recipient.email)}?subject=${encodeURIComponent('Set up your Wersee payout')}&body=${encodeURIComponent(`Use this private link to set up your payout account: ${recipientInvite?.url || ''}`)}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-4 font-bold text-white"
              >
                <Mail className="h-4 w-4" /> Send by email
              </a>
            </div>
            <button onClick={() => setOtherModal(false)} className="w-full rounded-2xl bg-white/5 py-4 font-bold text-white">Done</button>
          </>
        )}
      </SimpleModal>

      {userId && <PayoutScheduleModal isOpen={scheduleModal} onClose={() => setScheduleModal(false)} onSave={fetchPayouts} userId={userId} />}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-3xl border border-white/5 bg-[#141414] p-5">
    <p className="text-xs font-medium text-white/40">{label}</p>
    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
  </div>
);

const PayoutBalanceAnimation = ({ phase }: { phase: PayoutCheckPhase }) => {
  const checking = phase === 'checking' || phase === 'paying';
  const success = phase === 'eligible' || phase === 'success';
  const failed = phase === 'insufficient' || phase === 'error';

  return (
    <div className={`relative h-48 overflow-hidden rounded-[1.75rem] border transition-colors ${
      success ? 'border-emerald-300/20 bg-emerald-300/[0.08]' : failed ? 'border-amber-300/20 bg-amber-300/[0.06]' : 'border-white/10 bg-white/[0.035]'
    }`}>
      <motion.div
        animate={checking ? { rotate: 360 } : { rotate: 0 }}
        transition={checking ? { duration: 2.8, repeat: Infinity, ease: 'linear' } : { duration: 0.5 }}
        className={`absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed ${
          success ? 'border-emerald-300/35' : failed ? 'border-amber-300/30' : 'border-white/15'
        }`}
      />
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          animate={checking
            ? { y: [0, -12, 0], x: [0, index % 2 ? 8 : -8, 0], rotate: [index * 4 - 4, index * 4 + 4, index * 4 - 4] }
            : success ? { y: [0, -5, 0], rotate: index * 6 - 6 } : { y: 0, rotate: index * 6 - 6 }}
          transition={{ duration: 1.2 + index * 0.15, repeat: checking || success ? Infinity : 0, delay: index * 0.12 }}
          className="absolute left-1/2 top-1/2"
          style={{ marginLeft: `${(index - 1) * 38 - 24}px`, marginTop: `${(index % 2) * 9 - 22}px` }}
        >
          <div className={`flex h-11 w-16 items-center justify-center rounded-lg border shadow-xl ${
            success ? 'border-emerald-200/40 bg-emerald-300 text-emerald-950' : 'border-white/15 bg-[#242424] text-white/55'
          }`}>
            <Banknote className="h-6 w-6" />
          </div>
        </motion.div>
      ))}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.75 }}
          className={`absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-xl ${
            success ? 'border-emerald-200/25 bg-emerald-950/70 text-emerald-100'
              : failed ? 'border-amber-200/20 bg-amber-950/70 text-amber-100'
                : 'border-white/10 bg-black/55 text-white/55'
          }`}
        >
          {checking ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {phase === 'paying' ? 'Sending securely to Stripe' : 'Reading live balance'}</>
            : success ? <><CheckCircle2 className="h-3.5 w-3.5" /> {phase === 'success' ? 'Payout sent to Stripe' : 'Enough money available'}</>
              : failed ? <><WalletCards className="h-3.5 w-3.5" /> Balance needs attention</>
                : <><Coins className="h-3.5 w-3.5" /> Ready for a secure check</>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const MoneyInput = ({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/35">Amount in EUR</span>
    <input type="number" min="1" step="0.01" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder="0.00" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xl font-bold text-white outline-none focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-50" />
  </label>
);

const Field = ({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/35">{label}</span>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white outline-none focus:border-white/25" />
  </label>
);

const SimpleModal = ({ open, onClose, title, subtitle, children }: { open: boolean; onClose: () => void; title: string; subtitle: string; children: React.ReactNode }) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 18 }} className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#111] shadow-2xl shadow-black">
          <div className="flex items-start justify-between border-b border-white/5 p-6">
            <div><h2 className="text-2xl font-bold text-white">{title}</h2><p className="mt-1 text-sm text-white/40">{subtitle}</p></div>
            <button onClick={onClose} aria-label="Close modal" className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-5 p-6">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
