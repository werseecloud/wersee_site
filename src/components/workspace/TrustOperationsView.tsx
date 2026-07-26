import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Bot, FileWarning, Flag, Gavel, Loader2, LockKeyhole, RefreshCw, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const queues = [
  ['Reports', 'content_reports', 'status', ['received', 'triaged', 'under_review'], Flag],
  ['Moderation', 'moderation_cases', 'status', ['open', 'investigating', 'decision_ready'], Gavel],
  ['Appeals', 'appeals', 'status', ['submitted', 'under_review'], FileWarning],
  ['Privacy', 'privacy_requests', 'status', ['submitted', 'identity_verification', 'in_progress', 'waiting_for_user'], LockKeyhole],
  ['Safety', 'product_safety_profiles', 'status', ['incomplete', 'review_required', 'blocked'], ShieldAlert],
  ['AI reviews', 'ai_decision_reviews', 'status', ['review_requested', 'under_review'], Bot],
] as const;

export const TrustOperationsView = () => {
  const [role, setRole] = useState('');
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setLoading(false); return; }
    const { data: roles, error: roleError } = await supabase.from('trust_roles').select('role').eq('user_id', auth.user.id).eq('status', 'active');
    if (roleError || !roles?.length) {
      setRole('');
      setError('Trust Operations access is restricted to explicitly assigned staff roles.');
      setLoading(false);
      return;
    }
    setRole(roles[0].role);
    const results = await Promise.all(queues.map(async ([label, table, statusColumn, statuses]) => {
      const result = await supabase.from(table).select('*').in(statusColumn, [...statuses]).order('created_at', { ascending: true }).limit(20);
      return [label, result] as const;
    }));
    const failed = results.find(([, result]) => result.error);
    if (failed) setError(failed[1].error?.message || 'A review queue could not be loaded.');
    setItems(Object.fromEntries(results.map(([label, result]) => [label, result.data || []])));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-white/50" /></div>;
  if (!role) return <div className="mx-auto max-w-2xl rounded-3xl border border-amber-400/20 bg-amber-400/[0.06] p-8 text-center text-white"><AlertTriangle className="mx-auto h-8 w-8 text-amber-300" /><h1 className="mt-4 text-2xl font-black">Restricted Trust Operations area</h1><p className="mt-2 text-sm leading-6 text-white/50">{error}</p></div>;

  return <div className="mx-auto max-w-7xl space-y-6 pb-16 text-white">
    <header className="flex flex-col justify-between gap-4 rounded-[2rem] border border-white/[0.08] bg-[#111] p-6 sm:flex-row sm:items-end sm:p-8"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">Restricted · {role.replace(/_/g, ' ')}</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">Trust Operations</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Operational review queues. Actions require recorded reasons and remain subject to role and step-up controls.</p></div><button onClick={load} className="flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-black"><RefreshCw className="h-4 w-4" /> Refresh</button></header>
    {error && <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</div>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{queues.map(([label, , , , Icon]) => <article key={label} className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-blue-300" /><span className="text-2xl font-black">{items[label]?.length || 0}</span></div><h2 className="mt-4 text-lg font-black">{label}</h2><div className="mt-3 space-y-2">{(items[label] || []).slice(0, 4).map((item) => <div key={item.id} className="rounded-xl bg-white/[0.035] px-3 py-2"><p className="truncate text-xs font-bold">{item.case_id || item.report_code || item.system_name || item.product_identifier || item.id}</p><p className="mt-1 text-[10px] font-black uppercase tracking-wider text-white/30">{item.status}</p></div>)}{!items[label]?.length && <p className="text-xs text-white/30">Queue clear.</p>}</div></article>)}</section>
  </div>;
};
