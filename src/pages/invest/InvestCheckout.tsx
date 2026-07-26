import React, { useEffect, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatMoney, INVESTMENT_RISK_WARNING, parseMoneyToCents, platformFeeCents, RISK_ACCEPTANCE_TEXTS } from '../../lib/investments';
import { useAuth } from '../../context/AuthContext';
import { trustCenterAction, type ComplianceDecision } from '../../lib/trustCenter';
import { parseAccountHandle, routes } from '../../routing/routes';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export default function InvestCheckout() {
  const { campaignSlug, accountHandle, sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [campaign, setCampaign] = useState<any>(null);
  const [amountText, setAmountText] = useState('100');
  const [accepted, setAccepted] = useState<Record<number, boolean>>({});
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gateDecision, setGateDecision] = useState<ComplianceDecision | null>(null);
  const parsedAccountHandle = parseAccountHandle(accountHandle);
  const isPublicFundPath = window.location.pathname.startsWith('/fund/');
  const investBasePath = isPublicFundPath
    ? '/fund'
    : parsedAccountHandle && sessionId
      ? routes.accountInvest({ accountHandle: parsedAccountHandle, sessionId })
      : '/invest';

  useEffect(() => {
    if (!user) navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
  }, [user, navigate, location.pathname]);

  useEffect(() => {
    const load = async () => {
      const query = supabase.from('investment_campaigns').select('*, business:businesses(*)');
      const { data } = await (/^[0-9a-f-]{36}$/i.test(String(campaignSlug))
        ? query.eq('id', campaignSlug).single()
        : query.eq('slug', campaignSlug).single());
      if (!data) navigate('/invest', { replace: true });
      setCampaign(data);
      const requestedAmount = Number((location.state as any)?.amount || 0);
      if (requestedAmount > 0) {
        setAmountText(String(requestedAmount));
      } else if (data?.minimum_investment_cents) {
        setAmountText(String(data.minimum_investment_cents / 100));
      }
    };
    load();
  }, [campaignSlug, location.state, navigate]);

  useEffect(() => {
    if (!user || !campaign) return;
    trustCenterAction<{ decision: ComplianceDecision }>('evaluate', {
      action: 'invest_transaction',
      context: { campaign_id: campaign.id, country_code: campaign.country_code || '' },
    }).then((result) => setGateDecision(result.decision)).catch(() => setGateDecision({ id: '', allowed: false, requiredActions: [], blockingIssues: [{ code: 'gate_unavailable', title: 'Transactions are unavailable', explanation: 'The licensed-provider and approval gates could not be verified.' }], warnings: [], disclosures: [], auditReason: 'Gate verification failed.', policyVersion: 'review-required' }));
  }, [user, campaign]);

  const amountCents = useMemo(() => parseMoneyToCents(amountText), [amountText]);
  const feeCents = amountCents ? platformFeeCents(amountCents) : 0;
  const netCents = amountCents ? amountCents - feeCents : 0;
  const canContinue = Boolean(gateDecision?.allowed && amountCents && campaign && RISK_ACCEPTANCE_TEXTS.every((_, index) => accepted[index]));

  const startPayment = async () => {
    if (!campaign || !amountCents) return;
    setLoading(true);
    setError(null);
    try {
      const gate = await trustCenterAction<{ decision: ComplianceDecision }>('evaluate', {
        action: 'invest_transaction', context: { campaign_id: campaign.id, amount_cents: amountCents },
      });
      if (!gate.decision.allowed) throw new Error(gate.decision.blockingIssues[0]?.explanation || 'Investment transactions are not available.');
      const { data: orderData, error: orderError } = await supabase.functions.invoke('investment-create-order', {
        body: { campaignId: campaign.id, amountCents },
      });
      if (orderError || orderData?.error) throw new Error(orderData?.error || orderError?.message || 'Failed to create order');
      setOrderId(orderData.orderId);

      const { data: acceptanceData, error: acceptanceError } = await supabase.functions.invoke('investment-record-risk-acceptance', {
        body: {
          orderId: orderData.orderId,
          checkboxTexts: RISK_ACCEPTANCE_TEXTS,
          riskDocumentVersion: 'v1',
          kiisVersion: 'v1',
          termsVersion: 'v1',
        },
      });
      if (acceptanceError || acceptanceData?.error) throw new Error(acceptanceData?.error || acceptanceError?.message || 'Failed to save risk acceptance');

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('investment-create-payment', {
        body: { orderId: orderData.orderId },
      });
      if (paymentError || paymentData?.error) throw new Error(paymentData?.error || paymentError?.message || 'Failed to start payment');
      setClientSecret(paymentData.clientSecret);
    } catch (err: any) {
      setError(err.message || 'Failed to start payment');
    } finally {
      setLoading(false);
    }
  };

  if (!campaign) return <div className="min-h-screen bg-black pt-32 text-center text-gray-500">Loading checkout...</div>;

  return (
    <main className="min-h-screen bg-black pt-24 pb-16 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <section className="space-y-6">
          <Link to={`${investBasePath}/${campaign.slug}`} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to campaign
          </Link>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h1 className="text-3xl font-black">Confirm investment</h1>
            <p className="mt-2 text-gray-400">{campaign.business?.name} · {campaign.title}</p>

            {gateDecision && !gateDecision.allowed && <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100"><div className="font-black">Educational information only</div><p className="mt-1 leading-6">{gateDecision.blockingIssues[0]?.explanation || 'Wersee cannot accept or pool investment funds until a licensed provider structure and required approvals are active.'}</p></div>}

            <div className="mt-8">
              <label className="mb-2 block text-sm font-bold text-gray-300">Investment amount</label>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 250, 500].map((value) => (
                  <button key={value} onClick={() => setAmountText(String(value))} className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5">
                    {formatMoney(value * 100, campaign.currency)}
                  </button>
                ))}
              </div>
              <input value={amountText} onChange={(event) => setAmountText(event.target.value)} inputMode="decimal" className="mt-3 h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-lg font-bold outline-none focus:border-emerald-400" aria-label="Custom investment amount" />
              {amountCents !== null && amountCents < campaign.minimum_investment_cents && <p className="mt-2 text-sm text-red-300">Minimum is {formatMoney(campaign.minimum_investment_cents, campaign.currency)}.</p>}
            </div>

            <div className="mt-8 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
              <div className="mb-2 flex items-center gap-2 font-black"><AlertTriangle className="h-5 w-5" /> Risk statement</div>
              {INVESTMENT_RISK_WARNING}
            </div>

            <div className="mt-6 space-y-3">
              {RISK_ACCEPTANCE_TEXTS.map((text, index) => (
                <label key={text} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <input type="checkbox" checked={!!accepted[index]} onChange={(event) => setAccepted((current) => ({ ...current, [index]: event.target.checked }))} className="mt-1 h-5 w-5" />
                  <span className="text-sm text-gray-300">{text}</span>
                </label>
              ))}
            </div>

            {!clientSecret && (
              <button onClick={startPayment} disabled={!canContinue || loading} className="mt-6 w-full rounded-xl bg-emerald-500 px-5 py-4 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? 'Preparing payment...' : gateDecision?.allowed ? 'Go to secure payment' : 'Transactions unavailable'}
              </button>
            )}
            {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</p>}
          </div>

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#34d399', colorBackground: '#0a0a0a', colorText: '#ffffff', borderRadius: '12px' } } }}>
              <PaymentForm orderId={orderId} />
            </Elements>
          )}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-black">Summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <Summary label="Investor contributes" value={amountCents ? formatMoney(amountCents, campaign.currency) : '-'} />
              <Summary label="Wersee platform fee" value={formatMoney(feeCents, campaign.currency)} />
              <Summary label="Net for business before Stripe fees" value={formatMoney(netCents, campaign.currency)} />
              <Summary label="Stripe processing fees" value="Based on payment method" />
            </dl>
            <p className="mt-5 text-xs text-gray-500">The server recalculates the amount, capacity, and fee. The investor never pays more than the confirmed amount.</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-white/45"><CheckCircle2 className="h-4 w-4" /> Payment activates only after licensed-provider and approval gates pass</div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function PaymentForm({ orderId }: { orderId: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/workspace/money/investments${orderId ? `?order=${orderId}` : ''}` },
    });
    if (error) setMessage(error.message || 'Payment could not be confirmed');
    setSubmitting(false);
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6" aria-live="polite">
      <PaymentElement />
      {message && <p className="mt-4 rounded-xl bg-red-400/10 p-3 text-sm text-red-100">{message}</p>}
      <button disabled={!stripe || submitting} className="mt-6 w-full rounded-xl bg-white px-5 py-4 text-sm font-black text-black disabled:opacity-50">
        {submitting ? 'Confirming...' : 'Pay now'}
      </button>
    </form>
  );
}

function Summary({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4 border-b border-white/10 pb-3"><dt className="text-gray-400">{label}</dt><dd className="font-bold text-white">{value}</dd></div>;
}
