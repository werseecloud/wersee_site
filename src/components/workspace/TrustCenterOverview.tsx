import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, ExternalLink, FileCheck2, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PurchaseRightsPanel } from './PurchaseRightsPanel';

const statusStyle = (status: string) => status === 'verified' || status === 'complete' || status === 'approved'
  ? 'bg-emerald-400/10 text-emerald-200'
  : status === 'blocked' || status === 'rejected' || status === 'failed'
    ? 'bg-red-400/10 text-red-200'
    : 'bg-amber-400/10 text-amber-100';

export const TrustCenterOverview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setLoading(false); return; }
    const userId = auth.user.id;
    const [profileResult, sellerResult, requirementResult, decisionResult, policyResult] = await Promise.all([
      supabase.from('compliance_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('dsa_seller_verifications').select('trader_status,status,country_code,legal_name,updated_at').eq('seller_id', userId).maybeSingle(),
      supabase.from('compliance_requirements').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabase.from('compliance_decisions').select('id,action,allowed,blocking_issues,required_actions,audit_reason,policy_version,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('policy_versions').select('version_id,effective_at,change_summary,content_uri,policy_documents!inner(document_code,title)').eq('published', true).order('effective_at', { ascending: false }),
    ]);
    const firstError = [profileResult.error, requirementResult.error, decisionResult.error, policyResult.error].find(Boolean);
    if (firstError) setError(firstError.message);
    setProfile(profileResult.data);
    setSeller(sellerResult.data);
    setRequirements(requirementResult.data || []);
    setDecisions(decisionResult.data || []);
    setPolicies(policyResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-white/50" /></div>;

  const openRequirements = requirements.filter((item) => !['satisfied', 'waived', 'not_applicable'].includes(item.status));
  return <div className="mx-auto max-w-6xl space-y-6 pb-16 text-white">
    <header className="rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-blue-500/10 via-[#111] to-violet-500/10 p-6 sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Wersee Trust Center</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Clear requirements. Recorded decisions.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">See the controls that apply to your account, listings, payments and data. A status shown here is operational information, not a certification or legal-compliance guarantee.</p>
    </header>
    {error && <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</div>}
    <section className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5"><ShieldCheck className="h-5 w-5 text-blue-300" /><p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/30">Account risk</p><p className="mt-1 text-xl font-black capitalize">{profile?.risk_level || 'Standard review'}</p></div>
      <div className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5"><FileCheck2 className="h-5 w-5 text-violet-300" /><p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/30">Seller status</p><p className="mt-1 text-xl font-black capitalize">{seller?.status || 'Not started'}</p></div>
      <div className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5"><Clock3 className="h-5 w-5 text-amber-300" /><p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/30">Open requirements</p><p className="mt-1 text-xl font-black">{openRequirements.length}</p></div>
    </section>
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6"><h2 className="text-lg font-black">Your requirements</h2><div className="mt-4 space-y-2">{requirements.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/35">No account-specific requirements have been assigned.</p> : requirements.map((item) => <div key={item.id} className="rounded-2xl border border-white/[0.07] p-4"><div className="flex justify-between gap-3"><p className="text-sm font-bold">{String(item.requirement_code).replace(/_/g, ' ')}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusStyle(item.status)}`}>{item.status}</span></div>{item.reason && <p className="mt-2 text-xs leading-5 text-white/40">{item.reason}</p>}</div>)}</div></div>
      <div className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6"><h2 className="text-lg font-black">Recent compliance decisions</h2><div className="mt-4 space-y-2">{decisions.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/35">No recorded decisions yet.</p> : decisions.map((item) => <div key={item.id} className="rounded-2xl border border-white/[0.07] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold capitalize">{String(item.action).replace(/_/g, ' ')}</p>{item.allowed ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <AlertCircle className="h-4 w-4 text-red-300" />}</div><p className="mt-2 text-xs leading-5 text-white/40">{item.audit_reason}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/25">Policy {item.policy_version} · {new Date(item.created_at).toLocaleString()}</p></div>)}</div></div>
    </section>
    <PurchaseRightsPanel />
    <section className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6"><h2 className="text-lg font-black">Published policies</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{policies.map((item) => <a key={item.version_id} href={item.content_uri} className="flex min-h-16 items-center justify-between rounded-2xl border border-white/[0.07] px-4 text-sm font-bold hover:bg-white/[0.04]"><span>{item.policy_documents.title}<span className="mt-1 block text-[10px] font-normal text-white/35">Version {item.version_id}</span></span><ExternalLink className="h-4 w-4 text-white/30" /></a>)}</div></section>
  </div>;
};
