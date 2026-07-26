import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Clipboard, ExternalLink, Link2, Loader2, Plus,
  ShieldCheck, TriangleAlert, Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { appToast } from '@/lib/feedback';

type Campaign = {
  id: string; slug: string; title: string; short_description: string;
  goal_amount_cents: number; hard_cap_amount_cents: number; minimum_investment_cents: number;
  committed_amount_cents: number; settled_amount_cents: number; status: string;
  instrument_type: string; financials_json?: { equity_offered_percentage?: number };
  compliance_approved_at?: string | null; published_at?: string | null;
};

type CapTableEntry = {
  id: string; total_investment: number; equity_percentage: number;
  profiles?: { full_name?: string | null; avatar_url?: string | null } | null;
};

type ConnectState = {
  ready: boolean; reason?: string; chargesEnabled?: boolean; payoutsEnabled?: boolean;
};

const PUBLIC_CAMPAIGN_STATUSES = new Set(['live', 'funding_reached', 'funded', 'closed']);
const SUBMITTABLE_STATUSES = new Set(['draft', 'changes_requested', 'business_verification']);
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
const euros = (cents: number) => new Intl.NumberFormat('en-NL', { style: 'currency', currency: 'EUR' }).format(Number(cents || 0) / 100);

export function FundingView({ businessId }: { businessId?: string }) {
  const { user } = useAuth();
  const [resolvedBusinessId, setResolvedBusinessId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [capTable, setCapTable] = useState<CapTableEntry[]>([]);
  const [connectState, setConnectState] = useState<ConnectState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [pitch, setPitch] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [fundingGoal, setFundingGoal] = useState('');
  const [equityOffered, setEquityOffered] = useState('');
  const [minInvestment, setMinInvestment] = useState('100');
  const publicBaseUrl = useMemo(() => `${window.location.origin}/fund`, []);

  const resolveBusiness = async () => {
    if (!user) return null;
    if (!businessId) {
      const { data, error } = await supabase.from('businesses').select('id').eq('user_id', user.id).limit(1).maybeSingle();
      if (error) throw error;
      return data?.id || null;
    }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId);
    let query = supabase.from('businesses').select('id').eq('user_id', user.id);
    query = isUuid ? query.or(`slug.eq.${businessId},id.eq.${businessId}`) : query.eq('slug', businessId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data?.id || null;
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const effectiveBusinessId = await resolveBusiness();
      setResolvedBusinessId(effectiveBusinessId);
      if (!effectiveBusinessId) {
        setCampaigns([]);
        setCapTable([]);
        return;
      }
      const [campaignResult, capResult, connectResult] = await Promise.all([
        supabase.from('investment_campaigns')
          .select('id,slug,title,short_description,goal_amount_cents,hard_cap_amount_cents,minimum_investment_cents,committed_amount_cents,settled_amount_cents,status,instrument_type,financials_json,compliance_approved_at,published_at')
          .eq('business_id', effectiveBusinessId).order('created_at', { ascending: false }),
        supabase.from('cap_tables').select('id,total_investment,equity_percentage,profiles:user_id(full_name,avatar_url)')
          .eq('business_id', effectiveBusinessId).order('equity_percentage', { ascending: false }),
        supabase.functions.invoke('investment-connect-status', { body: { businessId: effectiveBusinessId } }),
      ]);
      if (campaignResult.error) throw campaignResult.error;
      if (capResult.error) throw capResult.error;
      setCampaigns((campaignResult.data || []) as Campaign[]);
      setCapTable((capResult.data || []) as CapTableEntry[]);
      setConnectState(connectResult.error ? { ready: false, reason: connectResult.error.message } : connectResult.data);
    } catch (error) {
      console.error('Error fetching funding data:', error);
      appToast('Funding data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, [businessId, user]);

  const resetForm = () => {
    setTitle(''); setPitch(''); setCustomSlug(''); setSlugTouched(false);
    setFundingGoal(''); setEquityOffered(''); setMinInvestment('100');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setCustomSlug(slugify(value));
  };

  const handleCreateCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !resolvedBusinessId) {
      appToast('Create or select a business before starting a funding campaign.');
      return;
    }
    const slug = slugify(customSlug);
    const goalCents = Math.round(Number(fundingGoal) * 100);
    const minimumCents = Math.round(Number(minInvestment) * 100);
    const equity = Number(equityOffered);
    if (slug.length < 3) return appToast('Use at least 3 characters for the public URL.');
    if (!Number.isFinite(goalCents) || goalCents < 100_000 || !Number.isFinite(minimumCents) || minimumCents < 1_000) {
      return appToast('Check the funding goal and minimum investment.');
    }
    if (!Number.isFinite(equity) || equity <= 0 || equity > 100) return appToast('Equity offered must be between 0 and 100%.');

    setSaving(true);
    try {
      const { error } = await supabase.from('investment_campaigns').insert({
        business_id: resolvedBusinessId,
        created_by: user.id,
        slug,
        title: title.trim(),
        short_description: pitch.trim(),
        full_description: pitch.trim(),
        instrument_type: 'equity',
        currency: 'eur',
        goal_amount_cents: goalCents,
        hard_cap_amount_cents: goalCents,
        minimum_investment_cents: minimumCents,
        funding_model: 'all_or_nothing',
        financials_json: { equity_offered_percentage: equity },
        status: 'draft',
      });
      if (error) throw error;
      setShowCreateModal(false);
      resetForm();
      appToast('Funding campaign saved as a real reviewable draft.', 'success');
      await fetchData();
    } catch (error: any) {
      console.error('Error creating funding campaign:', error);
      appToast(error?.code === '23505' ? 'That public URL is already in use.' : error?.message || 'Campaign could not be created.');
    } finally {
      setSaving(false);
    }
  };

  const submitCampaign = async (campaignId: string) => {
    setSubmittingId(campaignId);
    try {
      const { data, error } = await supabase.functions.invoke('investment-submit-campaign', { body: { campaignId } });
      if (error || data?.error) {
        const missing = Array.isArray(data?.details?.missing) ? ` Missing: ${data.details.missing.join(', ')}.` : '';
        throw new Error(`${data?.error || error?.message || 'Campaign could not be submitted.'}${missing}`);
      }
      appToast('Campaign submitted for compliance review.', 'success');
      await fetchData();
    } catch (error: any) {
      appToast(error?.message || 'Campaign could not be submitted.');
    } finally {
      setSubmittingId(null);
    }
  };

  const copyShareLink = async (campaign: Campaign) => {
    await navigator.clipboard.writeText(`${publicBaseUrl}/${campaign.slug}`);
    appToast('Funding link copied.', 'success');
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-emerald-400" /></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Funding & Cap Table</h1>
          <p className="text-gray-400">Create compliant funding rounds, accept verified Stripe payments and manage ownership.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-medium text-black hover:bg-emerald-400">
          <Plus className="h-4 w-4" /> New campaign
        </button>
      </div>

      <section className={`rounded-2xl border p-5 ${connectState?.ready ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-amber-500/20 bg-amber-500/10'}`}>
        <div className="flex items-start gap-3">
          {connectState?.ready ? <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-400" /> : <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-300" />}
          <div>
            <p className="font-semibold text-white">{connectState?.ready ? 'Stripe Connect is ready' : 'Stripe Connect needs attention'}</p>
            <p className="mt-1 text-sm text-gray-300">
              {connectState?.ready
                ? 'Payments are created server-side, confirmed by signed Stripe webhooks and settle only after the required investment approvals.'
                : connectState?.reason === 'stripe_missing'
                  ? 'Connect a Stripe account in Money settings before this campaign can accept payments.'
                  : 'Finish the Stripe requirements in Money settings before accepting funding payments.'}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="space-y-5">
          <h2 className="text-xl font-bold text-white">Your campaigns</h2>
          {campaigns.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="mb-4 text-gray-400">No funding campaigns yet.</p>
              <button onClick={() => setShowCreateModal(true)} className="font-medium text-emerald-400">Create your first campaign</button>
            </div>
          ) : campaigns.map((campaign) => {
            const progress = campaign.goal_amount_cents > 0 ? Math.min((campaign.committed_amount_cents / campaign.goal_amount_cents) * 100, 100) : 0;
            const isPublic = PUBLIC_CAMPAIGN_STATUSES.has(campaign.status) && !!campaign.compliance_approved_at && !!campaign.published_at;
            return (
              <article key={campaign.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{campaign.title}</h3>
                    <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-bold ${isPublic ? 'bg-emerald-500/20 text-emerald-300' : campaign.status === 'compliance_review' ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-gray-300'}`}>
                      {campaign.status.replaceAll('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right"><p className="text-xs text-gray-500">Committed</p><p className="font-bold text-white">{euros(campaign.committed_amount_cents)}</p></div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-sm"><span className="text-gray-400">Progress</span><span className="text-white">{progress.toFixed(1)}% of {euros(campaign.goal_amount_cents)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} /></div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/10 pt-4 text-sm">
                  <div><p className="text-gray-500">Equity</p><p className="font-medium text-white">{campaign.financials_json?.equity_offered_percentage ?? '—'}%</p></div>
                  <div><p className="text-gray-500">Minimum</p><p className="font-medium text-white">{euros(campaign.minimum_investment_cents)}</p></div>
                  <div><p className="text-gray-500">Settled</p><p className="font-medium text-white">{euros(campaign.settled_amount_cents)}</p></div>
                </div>
                <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Custom share URL</p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate text-sm text-gray-300">{publicBaseUrl}/{campaign.slug}</code>
                    <button onClick={() => void copyShareLink(campaign)} className="rounded-lg p-2 text-gray-300 hover:bg-white/10" aria-label="Copy funding link"><Clipboard className="h-4 w-4" /></button>
                    {isPublic && <a href={`/fund/${campaign.slug}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-gray-300 hover:bg-white/10" aria-label="Open funding page"><ExternalLink className="h-4 w-4" /></a>}
                  </div>
                  {!isPublic && <p className="mt-2 text-xs text-amber-200/70">The link becomes public after compliance approval and publication.</p>}
                </div>
                {SUBMITTABLE_STATUSES.has(campaign.status) && (
                  <button onClick={() => void submitCampaign(campaign.id)} disabled={!connectState?.ready || submittingId === campaign.id} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">
                    {submittingId === campaign.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Submit for review
                  </button>
                )}
              </article>
            );
          })}
        </section>

        <section className="space-y-5">
          <h2 className="text-xl font-bold text-white">Cap table</h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {capTable.length === 0 ? <div className="p-8 text-center text-gray-400">No issued external ownership entries yet.</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-white/10 bg-white/5 text-sm"><th className="p-4 font-medium text-gray-400">Investor</th><th className="p-4 font-medium text-gray-400">Invested</th><th className="p-4 font-medium text-gray-400">Equity</th></tr></thead>
                  <tbody>{capTable.map((entry) => (
                    <tr key={entry.id} className="border-b border-white/5">
                      <td className="p-4"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20"><Users className="h-4 w-4 text-emerald-400" /></div><span className="text-sm font-medium text-white">{entry.profiles?.full_name || 'Investor'}</span></div></td>
                      <td className="p-4 text-sm text-white">{new Intl.NumberFormat('en-NL', { style: 'currency', currency: 'EUR' }).format(Number(entry.total_investment || 0))}</td>
                      <td className="p-4 text-sm font-medium text-emerald-400">{Number(entry.equity_percentage).toFixed(4)}%</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="my-8 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-900">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div><h2 className="text-xl font-bold text-white">Create funding campaign</h2><p className="mt-1 text-xs text-gray-500">Saved as a draft before business and compliance review.</p></div>
              <button onClick={() => setShowCreateModal(false)} className="text-2xl text-gray-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-4 p-6">
              <label className="block text-sm font-medium text-gray-300">Campaign title<input required value={title} onChange={(event) => handleTitleChange(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white outline-none focus:border-emerald-500" placeholder="Seed round 2026" /></label>
              <label className="block text-sm font-medium text-gray-300">Pitch<textarea required rows={4} value={pitch} onChange={(event) => setPitch(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white outline-none focus:border-emerald-500" placeholder="Describe the business, traction and use of funds." /></label>
              <label className="block text-sm font-medium text-gray-300">Custom share URL
                <div className="mt-1 flex overflow-hidden rounded-xl border border-white/10 bg-black focus-within:border-emerald-500">
                  <span className="flex items-center border-r border-white/10 px-3 text-xs text-gray-500"><Link2 className="mr-1 h-3.5 w-3.5" />/fund/</span>
                  <input required minLength={3} value={customSlug} onChange={(event) => { setSlugTouched(true); setCustomSlug(slugify(event.target.value)); }} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-white outline-none" placeholder="my-seed-round" />
                </div>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-gray-300">Goal (€)<input type="number" required min="1000" value={fundingGoal} onChange={(event) => setFundingGoal(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
                <label className="block text-sm font-medium text-gray-300">Equity offered (%)<input type="number" required min="0.1" max="100" step="0.1" value={equityOffered} onChange={(event) => setEquityOffered(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
              </div>
              <label className="block text-sm font-medium text-gray-300">Minimum investment (€)<input type="number" required min="10" value={minInvestment} onChange={(event) => setMinInvestment(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">No simulated purchase is created. A real order only exists after investor eligibility, risk acceptance and a Stripe-confirmed payment.</div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 font-medium text-black disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save draft</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
