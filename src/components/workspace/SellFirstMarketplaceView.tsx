import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Info,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCcw,
  ShieldCheck,
  Store,
  UserRound,
  Wallet,
} from 'lucide-react';
import { invokeApiRunner } from '../../lib/supabase';

type Overview = {
  seller: any;
  classification: any;
  store: any;
  compliance: any;
  stripeAccount: any;
  requirements: any[];
  paymentPermission: any;
  payoutPermission: any;
  legalDocuments: any[];
  balances: {
    currency: string;
    pending: number;
    available: number;
    hold: number;
    dispute: number;
    refunded: number;
    paid_out: number;
    transactions: any[];
  };
};

const formatMoney = (minor = 0, currency = 'eur') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(minor / 100);

const emptyOverview: Overview = {
  seller: null,
  classification: null,
  store: null,
  compliance: null,
  stripeAccount: null,
  requirements: [],
  paymentPermission: null,
  payoutPermission: null,
  legalDocuments: [],
  balances: { currency: 'eur', pending: 0, available: 0, hold: 0, dispute: 0, refunded: 0, paid_out: 0, transactions: [] },
};

const questionLabels = [
  ['sells_as_business', 'I sell as part of a business or profession'],
  ['sells_regularly_for_profit', 'I sell regularly for profit'],
  ['registered_trade_register', 'I am registered with a trade register'],
  ['uses_business_name', 'I use a business name'],
  ['employs_others', 'I employ other people'],
  ['manufactures_or_imports', 'I manufacture or commercially import products'],
  ['buys_for_resale', 'I sell products purchased for resale'],
] as const;

const ProgressItem = ({ done, label, detail, action }: { done: boolean; label: string; detail: string; action?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${done ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      </div>
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">{detail}</p>
      </div>
    </div>
    {action}
  </div>
);

export const SellFirstMarketplaceView = () => {
  const [overview, setOverview] = useState<Overview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [step, setStep] = useState<'setup' | 'finance' | 'legal'>('setup');
  const [form, setForm] = useState({
    countryCode: 'NL',
    accountType: 'private_occasional',
    displayName: '',
    email: '',
    classification: 'private_occasional',
    storeName: '',
    storeHandle: '',
    storeCategory: 'general',
    shortDescription: '',
    supportEmail: '',
    displayLocation: 'Netherlands',
    currency: 'eur',
    acceptTerms: false,
    acceptFeeSchedule: false,
    acceptPayoutAgreement: false,
    answers: Object.fromEntries(questionLabels.map(([key]) => [key, false])) as Record<string, boolean>,
  });

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await invokeApiRunner('marketplace/get-overview');
      setOverview({ ...emptyOverview, ...result });
      if (result.seller || result.store || result.classification) {
        setForm((prev) => ({
          ...prev,
          countryCode: result.seller?.country_code || prev.countryCode,
          accountType: result.seller?.account_type || prev.accountType,
          displayName: result.seller?.display_name || prev.displayName,
          email: result.seller?.contact_email || prev.email,
          classification: result.classification?.classification || prev.classification,
          storeName: result.store?.store_name || prev.storeName,
          storeHandle: result.store?.store_handle || prev.storeHandle,
          storeCategory: result.store?.store_category || prev.storeCategory,
          shortDescription: result.store?.short_description || prev.shortDescription,
          supportEmail: result.store?.support_email || prev.supportEmail,
          displayLocation: result.store?.display_location || prev.displayLocation,
          currency: result.store?.preferred_currency || result.seller?.preferred_currency || prev.currency,
          acceptTerms: Boolean(result.seller?.platform_terms_accepted_at),
          acceptFeeSchedule: Boolean(result.seller?.current_fee_schedule_accepted_at),
          acceptPayoutAgreement: Boolean(result.seller?.payout_agreement_accepted_at),
          answers: {
            ...prev.answers,
            ...Object.fromEntries(questionLabels.map(([key]) => [key, Boolean(result.classification?.[key])])),
          },
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Could not load marketplace setup.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await invokeApiRunner('marketplace/save-onboarding', form);
      setOverview({ ...emptyOverview, ...result });
      setNotice('Seller setup saved.');
    } catch (err: any) {
      setError(err.message || 'Could not save seller setup.');
    } finally {
      setSaving(false);
    }
  };

  const setupPayments = async () => {
    setSaving(true);
    setError('');
    try {
      await invokeApiRunner('marketplace/create-connected-account', form);
      const link = await invokeApiRunner('marketplace/create-account-link', {
        returnUrl: window.location.href,
        refreshUrl: window.location.href,
      });
      if (link.url) window.location.href = link.url;
    } catch (err: any) {
      setError(err.message || 'Could not start payment setup.');
    } finally {
      setSaving(false);
    }
  };

  const syncStripe = async () => {
    setSaving(true);
    setError('');
    try {
      await invokeApiRunner('marketplace/sync-connected-account');
      await refresh();
      setNotice('Payment verification status refreshed.');
    } catch (err: any) {
      setError(err.message || 'Could not refresh payment status.');
    } finally {
      setSaving(false);
    }
  };

  const progress = useMemo(() => {
    const stripe = overview.stripeAccount;
    const traderVerified = overview.classification?.trader_status === 'private_seller_declared' || overview.classification?.trader_status === 'trader_information_verified';
    return [
      { label: 'Store created', done: Boolean(overview.store), detail: overview.store ? 'Your store details are saved.' : 'Create your storefront before publishing products.' },
      { label: 'Seller type declared', done: Boolean(overview.classification?.declared_at), detail: overview.classification?.suspicious_classification ? 'Your declaration needs manual review.' : 'Choose the option that describes how you actually sell.' },
      { label: 'Trader details completed', done: traderVerified, detail: traderVerified ? 'Marketplace trader declaration is complete for now.' : 'Professional sellers must complete trader information before selling to EU consumers.' },
      { label: 'Payments activated', done: Boolean(stripe?.charges_enabled), detail: stripe?.charges_enabled ? 'Stripe currently permits charges.' : 'Payments can only start after Stripe and Wersee checks allow it.' },
      { label: 'Identity verification', done: Boolean(stripe?.details_submitted && !stripe?.requirements_currently_due?.length), detail: 'Stripe securely verifies identity and business details. Wersee does not store identity documents.' },
      { label: 'Bank account', done: Boolean(stripe?.payouts_enabled), detail: stripe?.payouts_enabled ? 'Payout bank details are accepted by Stripe.' : 'Add or verify payout bank details in Stripe.' },
      { label: 'Tax information', done: overview.compliance?.payout_eligibility !== 'tax_information_required', detail: 'Tax information is requested only when required by activity, seller type or policy.' },
      { label: 'Payouts enabled', done: overview.payoutPermission?.can_receive_payouts === true, detail: overview.payoutPermission?.reason_message || 'Earnings remain pending until all release conditions pass.' },
    ];
  }, [overview]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-blue-400" />
        Loading seller setup...
      </div>
    );
  }

  const currency = overview.balances.currency || 'eur';

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16 text-white">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-300">
            <ShieldCheck className="h-4 w-4" />
            Sell first, verify before payout
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">Seller workspace</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400 md:text-base">
            Create your store now and complete verification when required. Depending on your seller type and location, some details may be needed before products can go live or payments can be accepted.
          </p>
        </div>
        <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {[
            ['setup', 'Setup'],
            ['finance', 'Finance'],
            ['legal', 'Launch'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setStep(id as any)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${step === id ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(error || notice) && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${error ? 'border-red-500/20 bg-red-500/10 text-red-200' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'}`}>
          {error ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
          <span>{error || notice}</span>
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-[#111]/80 p-5 shadow-2xl md:p-7">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
          <p className="text-sm leading-relaxed text-gray-300">
            Creating a store does not guarantee approval for payment processing or payouts. Your eligible earnings remain pending until Stripe and Wersee have completed the required checks.
          </p>
        </div>
      </div>

      {step === 'setup' && (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 rounded-3xl border border-white/10 bg-[#111] p-5 md:p-7">
            <div className="flex items-center gap-3">
              <Store className="h-6 w-6 text-blue-300" />
              <h2 className="text-xl font-black">Onboarding</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-bold text-gray-300">
                Country
                <select value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-400">
                  <option value="NL">Netherlands</option>
                  <option value="BE">Belgium</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="IE">Ireland</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-bold text-gray-300">
                Account type
                <select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value, classification: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-400">
                  <option value="private_occasional">Private or occasional seller</option>
                  <option value="sole_proprietor">Sole proprietor</option>
                  <option value="registered_business">Registered business</option>
                  <option value="organisation">Organisation</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-bold text-gray-300">
                Display name
                <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-400" />
              </label>
              <label className="space-y-2 text-sm font-bold text-gray-300">
                Email address
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value, supportEmail: form.supportEmail || e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-400" />
              </label>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-start gap-3">
                <UserRound className="h-5 w-5 text-blue-300" />
                <div>
                  <h3 className="font-black">Seller classification</h3>
                  <p className="mt-1 text-sm text-gray-400">Choose the option that describes how you actually sell. Providing incorrect information can result in delayed payouts or account suspension.</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {questionLabels.map(([key, label]) => (
                  <label key={key} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.answers[key]}
                      onChange={(e) => setForm({ ...form, answers: { ...form.answers, [key]: e.target.checked } })}
                      className="mt-1"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-bold text-gray-300">
                Store name
                <input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-400" />
              </label>
              <label className="space-y-2 text-sm font-bold text-gray-300">
                Store handle
                <input value={form.storeHandle} onChange={(e) => setForm({ ...form, storeHandle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-400" />
              </label>
              <label className="space-y-2 text-sm font-bold text-gray-300">
                Store category
                <input value={form.storeCategory} onChange={(e) => setForm({ ...form, storeCategory: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-400" />
              </label>
              <label className="space-y-2 text-sm font-bold text-gray-300">
                Support email
                <input value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-400" />
              </label>
            </div>
            <label className="space-y-2 text-sm font-bold text-gray-300">
              Short description
              <textarea value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="min-h-24 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-400" />
            </label>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['acceptTerms', 'Wersee platform terms'],
                ['acceptFeeSchedule', '2% fee schedule'],
                ['acceptPayoutAgreement', 'Payout agreement'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-3 text-sm font-bold text-gray-300">
                  <input type="checkbox" checked={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked } as any)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={save} disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-black transition hover:bg-gray-100 disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save setup
              </button>
              <button onClick={setupPayments} disabled={saving || !overview.seller} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 font-black text-white transition hover:bg-blue-400 disabled:opacity-60">
                Set up payments
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.section>

          <section className="space-y-4">
            {progress.map((item) => (
              <ProgressItem
                key={item.label}
                done={item.done}
                label={item.label}
                detail={item.detail}
                action={item.label.includes('Payments') || item.label.includes('Identity') || item.label.includes('Bank') ? (
                  <button onClick={overview.stripeAccount ? syncStripe : setupPayments} className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
                    {overview.stripeAccount ? 'Refresh' : 'Continue setup'}
                  </button>
                ) : undefined}
              />
            ))}
          </section>
        </div>
      )}

      {step === 'finance' && (
        <div className="space-y-6">
          {overview.payoutPermission?.can_receive_payouts !== true && (
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 text-amber-300" />
                <div>
                  <h2 className="font-black text-amber-100">Verification required for payouts</h2>
                  <p className="mt-1 text-sm leading-relaxed text-amber-100/80">Your store can continue operating only where permitted, but payouts are currently locked. Complete the requested verification steps to receive eligible earnings.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={setupPayments} className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black">Complete verification</button>
                    <button onClick={() => setStep('setup')} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-white">View requirements</button>
                    <a href="/support" className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-white">Contact support</a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {[
              ['Pending earnings', overview.balances.pending, Clock],
              ['Available for transfer', overview.balances.available, Wallet],
              ['On hold', overview.balances.hold, LockKeyhole],
              ['In dispute', overview.balances.dispute, AlertCircle],
              ['Refunded', overview.balances.refunded, RefreshCcw],
              ['Paid out', overview.balances.paid_out, Banknote],
            ].map(([label, value, Icon]: any) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-[#111] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <Icon className="h-5 w-5 text-blue-300" />
                  {label === 'Pending earnings' && <Info className="h-4 w-4 text-gray-500" aria-label="These earnings are not yet available for payout. Verification, order completion, refund periods, disputes or other checks may delay release." />}
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
                <p className="mt-2 text-2xl font-black">{formatMoney(value, currency)}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111]">
            <div className="border-b border-white/10 p-5">
              <h2 className="text-xl font-black">Transactions</h2>
              <p className="mt-1 text-sm text-gray-400">Pending earnings are accounting records, not withdrawable stored value.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="p-4">Order</th>
                    <th className="p-4">Seller amount</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Transfer</th>
                    <th className="p-4">Hold reason</th>
                    <th className="p-4">Next action</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.balances.transactions.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No marketplace transactions yet.</td></tr>
                  ) : overview.balances.transactions.map((tx) => (
                    <tr key={tx.idempotency_key || `${tx.order_id}-${tx.created_at}`} className="border-t border-white/5">
                      <td className="p-4 font-mono text-xs text-gray-400">{tx.order_id || 'Pending'}</td>
                      <td className="p-4 font-bold text-white">{formatMoney(tx.amount_minor, tx.currency)}</td>
                      <td className="p-4 text-gray-300">{tx.entry_type}</td>
                      <td className="p-4 text-gray-300">{tx.stripe_object_id ? 'Recorded' : 'Not transferred'}</td>
                      <td className="p-4 text-gray-400">{tx.description}</td>
                      <td className="p-4 text-gray-300">{overview.payoutPermission?.reason_message || 'Wait for release checks'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {step === 'legal' && (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-[#111] p-6">
            <div className="mb-4 flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-300" />
              <h2 className="text-xl font-black">Production launch checklist</h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">Live marketplace payments remain disabled server-side until `MARKETPLACE_PAYMENTS_APPROVED=true` and every professional review item is completed.</p>
            <div className="mt-5 space-y-3 text-sm text-gray-300">
              {[
                'Stripe approval for the exact marketplace payment flow',
                'Connected-account configuration confirmed',
                'Merchant of record, fees, negative balances, refunds and disputes confirmed',
                'Dutch fintech/payments lawyer review',
                'PSD2, DAC7, DSA, GDPR, consumer-law and VAT assessments',
                'Seller agreement and payment terms reviewed by qualified counsel',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/[0.03] p-3">
                  <HelpCircle className="mt-0.5 h-4 w-4 text-amber-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#111] p-6">
            <div className="mb-4 flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-300" />
              <h2 className="text-xl font-black">Legal document placeholders</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {overview.legalDocuments.map((doc) => (
                <div key={`${doc.document_type}-${doc.version}`} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="font-bold text-white">{doc.title}</p>
                  <p className="mt-1 text-xs text-amber-300">Legal templates must be reviewed and approved by qualified counsel before production use.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
