import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { invokeApiRunner } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { parseAccountHandle, routes } from '../../routing/routes';

export default function WerseeListingDetail() {
  const { slug = '', accountHandle, sessionId } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [supporting, setSupporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await invokeApiRunner('invest/wersee/get', { slug }, 1, 300);
      setListing(response.listing);
    } catch (error: any) {
      setMessage(error.message || 'Listing could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [slug]);

  const progress = useMemo(() => {
    const target = Number(listing?.target_amount_minor || 0);
    if (!target) return 0;
    return Math.min(100, Math.round((Number(listing.received_amount_minor || 0) / target) * 100));
  }, [listing]);

  const registerInterest = async () => {
    if (!listing) return;
    if (!user) {
      setMessage('Sign in to register interest.');
      return;
    }
    await invokeApiRunner('invest/wersee/register-interest', { listingId: listing.id, consent: true, communicationPreference: 'email' }, 1, 300);
    setMessage('Interest registered. No payment or allocation was created.');
  };

  const createCheckout = async (tier?: any) => {
    if (!listing) return;
    if (!user) {
      setMessage('Sign in before supporting this company.');
      return;
    }
    setSupporting(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-wersee-funding-checkout', {
        body: {
          listingId: listing.id,
          tierId: tier?.id,
          amountMinor: tier ? undefined : listing.minimum_amount_minor,
          currency: listing.currency,
        },
      });
      if (error) throw error;
      if (data?.checkoutUrl) window.location.assign(data.checkoutUrl);
    } catch (error: any) {
      setMessage(error.message || 'Checkout could not be created.');
    } finally {
      setSupporting(false);
    }
  };

  if (loading) return <main className="min-h-screen bg-black pt-32 text-center text-gray-500">Loading Wersee listing...</main>;
  if (!listing) return <main className="min-h-screen bg-black pt-32 text-center text-red-200">{message || 'Listing not found.'}</main>;

  const canPay = ['support', 'reward', 'preorder'].includes(listing.funding_mode) && listing.payments_enabled && listing.compliance_approved;
  const ctaLabel = listing.funding_mode === 'regulated_investment' || !canPay ? 'Register interest' : listing.funding_mode === 'preorder' ? 'Preorder' : listing.funding_mode === 'reward' ? 'Support for reward' : 'Support';
  const parsedAccountHandle = parseAccountHandle(accountHandle);
  const investBasePath = parsedAccountHandle && sessionId
    ? routes.accountInvest({ accountHandle: parsedAccountHandle, sessionId })
    : '/invest';

  return (
    <main className="min-h-screen bg-black pt-24 text-white">
      <Helmet>
        <title>{listing.title} | Wersee Invest</title>
        <meta name="description" content={listing.short_description || `Wersee company listing for ${listing.business?.name || listing.title}.`} />
        <link rel="canonical" href={`https://wersee.com/invest/wersee/${listing.slug}`} />
      </Helmet>

      <section className="mx-auto max-w-7xl space-y-6 px-4 pb-16 sm:px-6 lg:px-8">
        <Link to={investBasePath} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Invest
        </Link>

        {message && <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm text-blue-100">{message}</div>}

        <header className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          {listing.hero_image_url && <img src={listing.hero_image_url} alt="" className="h-64 w-full object-cover" />}
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="flex items-center gap-3">
                {listing.business?.logo_url ? <img src={listing.business.logo_url} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><Building2 className="h-6 w-6" /></div>}
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-200">
                    {listing.business?.name}
                    <ShieldCheck className="h-4 w-4" />
                    Verified Wersee business
                  </div>
                  <h1 className="mt-1 text-3xl font-black md:text-5xl">{listing.title}</h1>
                </div>
              </div>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-gray-300">{listing.short_description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                <span className="rounded-full border border-white/10 px-3 py-1">{listing.sector || 'Sector unavailable'}</span>
                <span className="rounded-full border border-white/10 px-3 py-1">{listing.business_stage || 'Stage unavailable'}</span>
                <span className="rounded-full border border-white/10 px-3 py-1">{listing.funding_mode}</span>
                <span className="rounded-full border border-white/10 px-3 py-1">{listing.status}</span>
              </div>
            </div>
            <aside className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="text-sm text-gray-500">Funding progress</div>
              <div className="mt-2 text-3xl font-black">{formatMinor(listing.received_amount_minor, listing.currency)}</div>
              <div className="mt-1 text-sm text-gray-500">of {formatMinor(listing.target_amount_minor, listing.currency)}</div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-blue-400" style={{ width: `${progress}%` }} /></div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Metric label="Remaining" value={formatMinor(Math.max(0, Number(listing.target_amount_minor || 0) - Number(listing.received_amount_minor || 0)), listing.currency)} />
                <Metric label="Supporters" value={listing.supporter_count || 0} />
                <Metric label="Minimum" value={formatMinor(listing.minimum_amount_minor, listing.currency)} />
                <Metric label="Days remaining" value={daysRemaining(listing.closes_at) ?? 'Open'} />
              </dl>
              <button onClick={canPay ? () => createCheckout() : registerInterest} disabled={supporting} className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-black text-black disabled:opacity-60">
                {supporting ? 'Opening checkout...' : ctaLabel}
              </button>
              <p className="mt-4 text-xs leading-relaxed text-gray-500">
                This payment supports or purchases from the company under the displayed terms. It does not provide shares, ownership, interest, dividends, or a guaranteed financial return.
              </p>
            </aside>
          </div>
        </header>

        <Section title="Company summary">
          <TextBlock label="What the company does" value={listing.full_description} />
          <TextBlock label="Problem" value={listing.problem} />
          <TextBlock label="Solution" value={listing.solution} />
          <TextBlock label="Market" value={listing.market} />
          <TextBlock label="Business model" value={listing.business_model} />
          <TextBlock label="Traction" value={listing.traction} />
        </Section>

        <Section title="Financial performance">
          <p className="mb-4 text-sm text-gray-500">Company financial and valuation information may be company-reported, estimated, unaudited, reviewed, or externally verified. Check the status and effective date shown next to each figure.</p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(listing.financialPeriods || []).map((period: any) => (
              <div key={period.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="font-black">{new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}</div>
                <Metric label="Revenue" value={formatMoney(period.revenue, period.currency)} />
                <Metric label="Net profit/loss" value={formatMoney(period.net_profit_loss, period.currency)} />
                <Metric label="MRR" value={formatMoney(period.mrr, period.currency)} />
                <div className="mt-3 text-xs font-bold text-blue-200">{verificationLabel(period.verification_status)} · As of {new Date(period.as_of_date).toLocaleDateString()}</div>
              </div>
            ))}
            {(listing.financialPeriods || []).length === 0 && <Empty text="No financial periods published." />}
          </div>
        </Section>

        <Section title="Valuation">
          <div className="grid gap-3 md:grid-cols-2">
            {(listing.valuationEvents || []).map((event: any) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <Metric label="Pre-money value" value={formatMoney(event.pre_money_value, event.currency)} />
                <Metric label="Post-money value" value={event.post_money_value ? formatMoney(event.post_money_value, event.currency) : 'Not available'} />
                <Metric label="Method" value={event.method} />
                <p className="mt-3 text-sm text-gray-400">{event.explanation}</p>
                <div className="mt-3 text-xs text-gray-500">{event.verified ? 'Verified' : 'Company reported'} · {new Date(event.effective_at).toLocaleDateString()}</div>
              </div>
            ))}
            {(listing.valuationEvents || []).length === 0 && <Empty text="No valuation events published." />}
          </div>
          <p className="mt-4 text-sm text-gray-500">A company valuation is not equivalent to a liquid stock-market price.</p>
        </Section>

        <Section title="Use of funds">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(listing.useOfFunds || []).map((fund: any) => (
              <div key={fund.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="font-black">{fund.title}</div>
                <p className="mt-2 text-sm text-gray-400">{fund.description}</p>
                <Metric label="Amount" value={formatMinor(fund.amount_minor, listing.currency)} />
                <Metric label="Percentage" value={`${Number(fund.percentage).toLocaleString()}%`} />
                <Metric label="Milestone" value={fund.milestone || 'Not specified'} />
              </div>
            ))}
            {(listing.useOfFunds || []).length === 0 && <Empty text="No use-of-funds plan published." />}
          </div>
        </Section>

        <Section title="Risks">
          <div className="grid gap-3 md:grid-cols-2">
            {(listing.risks || []).map((risk: any) => (
              <div key={risk.id} className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
                <div className="text-xs font-black uppercase tracking-widest text-red-200">{risk.risk_type}</div>
                <h3 className="mt-2 font-black">{risk.title}</h3>
                <p className="mt-2 text-sm text-red-50/80">{risk.description}</p>
              </div>
            ))}
            {(listing.risks || []).length === 0 && <Empty text="No risks published. Listing should not be published without explicit risks." />}
          </div>
        </Section>

        <Section title="Documents and updates">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              {(listing.documents || []).map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-white/10 p-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="font-bold">{doc.title}</span>
                  {doc.approved && <CheckCircle2 className="ml-auto h-4 w-4 text-blue-300" />}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {(listing.updates || []).map((update: any) => (
                <div key={update.id} className="rounded-xl border border-white/10 p-3">
                  <div className="font-black">{update.title}</div>
                  <p className="mt-1 line-clamp-3 text-sm text-gray-400">{update.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {listing.tiers?.length > 0 && canPay && (
          <Section title="Support tiers">
            <div className="grid gap-3 md:grid-cols-3">
              {listing.tiers.map((tier: any) => (
                <button key={tier.id} onClick={() => createCheckout(tier)} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left hover:border-blue-300">
                  <div className="font-black">{tier.title}</div>
                  <div className="mt-2 text-xl font-black">{formatMinor(tier.amount_minor, tier.currency)}</div>
                  <p className="mt-2 text-sm text-gray-400">{tier.description}</p>
                </button>
              ))}
            </div>
          </Section>
        )}
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"><h2 className="mb-5 text-2xl font-black">{title}</h2>{children}</section>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="mt-3"><div className="text-xs uppercase tracking-widest text-gray-500">{label}</div><div className="mt-1 font-black text-white">{value}</div></div>;
}

function TextBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return <div className="mb-4"><h3 className="font-black">{label}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-400">{value}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-white/10 p-6 text-sm text-gray-500">{text}</div>;
}

function formatMinor(value: unknown, currency = 'usd') {
  if (value === null || value === undefined || value === '') return 'Not available';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(currency || 'usd').toUpperCase() }).format(Number(value) / 100);
}

function formatMoney(value: unknown, currency = 'usd') {
  if (value === null || value === undefined || value === '') return 'Not available';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(currency || 'usd').toUpperCase() }).format(Number(value));
}

function verificationLabel(status: string) {
  if (status === 'verified') return 'Externally verified';
  if (status === 'reviewed') return 'Reviewed by Wersee';
  if (status === 'audited') return 'Audited';
  return 'Company reported';
}

function daysRemaining(endAt?: string | null) {
  if (!endAt) return null;
  const diff = new Date(endAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}
