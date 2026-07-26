import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ShieldAlert, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { daysRemaining, formatMoney, INVESTMENT_RISK_WARNING, progressPercent } from '../../lib/investments';
import { parseAccountHandle, routes } from '../../routing/routes';

export default function InvestCampaignDetail() {
  const { campaignSlug, accountHandle, sessionId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const openDocument = async (documentId: string) => {
    const { data, error } = await supabase.functions.invoke('investment-document-url', {
      body: { documentId },
    });
    if (!error && data?.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('investment_campaigns')
        .select('*, business:businesses(*)')
        .eq('slug', campaignSlug)
        .single();

      if (error || !data) {
        navigate('/invest', { replace: true });
        return;
      }

      setCampaign(data);
      const [{ data: docs }, { data: campaignUpdates }] = await Promise.all([
        supabase.from('investment_campaign_documents').select('*').eq('campaign_id', data.id).order('created_at', { ascending: false }),
        supabase.from('investment_campaign_updates').select('*').eq('campaign_id', data.id).order('published_at', { ascending: false }),
      ]);
      setDocuments(docs || []);
      setUpdates(campaignUpdates || []);
      setLoading(false);
    };
    load();
  }, [campaignSlug, navigate]);

  if (loading) return <div className="min-h-screen bg-black pt-32 text-center text-gray-500">Loading campaign...</div>;
  if (!campaign) return null;

  const business = campaign.business || {};
  const progress = progressPercent(campaign.committed_amount_cents, campaign.goal_amount_cents);
  const financials = campaign.financials_json || {};
  const parsedAccountHandle = parseAccountHandle(accountHandle);
  const isPublicFundPath = window.location.pathname.startsWith('/fund/');
  const investBasePath = isPublicFundPath
    ? '/fund'
    : parsedAccountHandle && sessionId
      ? routes.accountInvest({ accountHandle: parsedAccountHandle, sessionId })
      : '/invest';

  return (
    <main className="min-h-screen bg-black pt-24 pb-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(isPublicFundPath ? '/' : investBasePath)} className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          {isPublicFundPath ? 'Close campaign' : 'Back to Wersee Invest'}
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="h-48 bg-gradient-to-br from-emerald-500/20 via-zinc-900 to-black" />
              <div className="p-6 md:p-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt="" className="h-20 w-20 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-2xl font-black">{business.name?.[0] || 'W'}</div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-emerald-300"><ShieldCheck className="h-4 w-4" /> Verified business</div>
                    <h1 className="mt-2 text-3xl font-black md:text-5xl">{campaign.title}</h1>
                    <p className="mt-2 text-gray-400">{business.name} · {campaign.sector || 'Sector not specified'} · {campaign.country_code || business.country_code || 'Country not specified'}</p>
                  </div>
                </div>
                <p className="mt-8 max-w-3xl whitespace-pre-wrap text-gray-300">{campaign.full_description || campaign.short_description}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm leading-relaxed text-red-100">
              <div className="mb-2 flex items-center gap-2 font-black"><ShieldAlert className="h-5 w-5" /> Risks</div>
              {INVESTMENT_RISK_WARNING}
            </div>

            <Panel title="Business information">
              <InfoGrid items={[
                ['Legal name', business.legal_name],
                ['Trading name', business.name],
                ['Registration number', business.registration_number],
                ['Founded on', business.founded_on],
                ['Country of establishment', business.country_code],
                ['Website', business.website],
                ['Legal form', business.legal_form],
                ['Business model', financials.business_model],
              ]} />
              {campaign.team_json?.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-gray-500">Team</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {campaign.team_json.map((member: any, index: number) => (
                      <div key={`${member.name || 'member'}-${index}`} className="rounded-xl bg-white/[0.04] p-4">
                        <div className="font-bold">{member.name}</div>
                        <div className="text-sm text-gray-400">{member.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Financial information">
              <InfoGrid items={[
                ['Historical revenue', financials.historical_revenue],
                ['Costs', financials.costs],
                ['Profit/loss', financials.profit_loss],
                ['Debt', financials.debt],
                ['Funding need', financials.funding_need],
                ['Use of funds', campaign.use_of_funds],
                ['Forecasts', campaign.forecast_json?.summary],
                ['Assumptions', campaign.forecast_json?.assumptions],
              ]} />
              <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                This is a forecast and not a guarantee of future results.
              </p>
            </Panel>

            <Panel title="Documents">
              {documents.length === 0 ? (
                <p className="text-gray-500">No public approved documents are available yet.</p>
              ) : (
                <div className="grid gap-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div>
                        <div className="font-bold">{doc.title}</div>
                        <div className="text-xs text-gray-500">{doc.document_type} · version {doc.version} · hash {doc.sha256_hash.slice(0, 12)}...</div>
                      </div>
                      <button type="button" onClick={() => openDocument(doc.id)} className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-black">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Campaign updates">
              {updates.length === 0 ? <p className="text-gray-500">No updates yet.</p> : updates.map((update) => (
                <article key={update.id} className="mb-4 rounded-xl bg-white/[0.04] p-4">
                  <h3 className="font-bold">{update.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-400">{update.content}</p>
                </article>
              ))}
            </Panel>
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="mb-4 flex items-end justify-between">
                <div className="text-3xl font-black text-emerald-300">{formatMoney(campaign.committed_amount_cents, campaign.currency)}</div>
                <div className="text-sm text-gray-500">of {formatMoney(campaign.goal_amount_cents, campaign.currency)}</div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${progress}%` }} />
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <Row label="Instrument" value={campaign.instrument_type} />
                <Row label="Minimum" value={formatMoney(campaign.minimum_investment_cents, campaign.currency)} />
                <Row label="Maximum" value={campaign.maximum_investment_cents ? formatMoney(campaign.maximum_investment_cents, campaign.currency) : 'Not specified'} />
                <Row label="Hard cap" value={formatMoney(campaign.hard_cap_amount_cents, campaign.currency)} />
                <Row label="Remaining term" value={`${daysRemaining(campaign.end_at) ?? 'Open'} days`} />
                <Row label="Funding model" value={campaign.funding_model} />
                <Row label="Risk class" value={campaign.risk_classification} />
              </dl>
              <Link to={`${investBasePath}/${campaign.slug}/checkout`} className="mt-6 block rounded-xl bg-emerald-500 px-5 py-4 text-center text-sm font-black text-black">
                Invest
              </Link>
              <p className="mt-4 text-xs text-gray-500">Pay with all payment methods available for your country, currency, and investment.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><h2 className="mb-5 text-xl font-black">{title}</h2>{children}</section>;
}

function InfoGrid({ items }: { items: Array<[string, any]> }) {
  return <dl className="grid gap-3 md:grid-cols-2">{items.map(([label, value]) => <Row key={label} label={label} value={value || 'Not specified'} />)}</dl>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl bg-white/[0.03] p-4"><dt className="text-xs uppercase tracking-widest text-gray-500">{label}</dt><dd className="mt-1 font-bold text-white">{value}</dd></div>;
}
