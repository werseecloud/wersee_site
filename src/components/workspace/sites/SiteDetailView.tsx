import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity, ArrowLeft, Bot, CheckCircle2, Clock3, Code2, Copy, ExternalLink, FileArchive,
  Globe2, Loader2, MoreHorizontal, RefreshCw, Rocket, RotateCcw, Save, Settings2,
  SearchCheck, ShieldCheck, Trash2, UploadCloud,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { appToast, destructiveAction } from '@/lib/feedback';
import { sitesRequest, type WerseeSite, type WerseeSiteRelease } from '@/services/sitesService';
import { SiteEditorView } from '../SiteEditorView';

type SiteDetail = {
  site: WerseeSite;
  releases: WerseeSiteRelease[];
  jobs: Array<{ id: string; status: string; stage: string; progress: number; support_reference?: string; error_message?: string; started_at: string }>;
  audit: Array<{ id: string; action: string; occurred_at: string; metadata?: Record<string, unknown> }>;
};

type Tab = 'overview' | 'deployments' | 'builder' | 'settings';

const bytes = (value = 0) => {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

const relativeTime = (value?: string | null) => {
  if (!value) return 'Never';
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
};

const statusStyle = (status: string) => {
  if (['published', 'completed', 'ready'].includes(status)) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  if (['failed', 'invalid'].includes(status)) return 'bg-red-500/10 text-red-300 border-red-500/20';
  if (['publishing', 'running', 'created', 'validating'].includes(status)) return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
  return 'bg-white/5 text-white/45 border-white/10';
};

export const SiteDetailView: React.FC<{
  siteId: string;
  onBack: () => void;
  onUpload: (site: WerseeSite) => void;
  onDeleted: () => void;
  onAnalytics: (siteId: string) => void;
}> = ({ siteId, onBack, onUpload, onDeleted, onAnalytics }) => {
  const [detail, setDetail] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [form, setForm] = useState({ name: '', slug: '', description: '', spaFallback: false, analyticsEnabled: true, indexingEnabled: true, aiTextEnhancementEnabled: false, strictSecurityMode: true, defaultDocument: 'index.html', custom404Behavior: 'default' });

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const next = await sitesRequest<SiteDetail>(`/${siteId}`);
      setDetail(next);
      setForm({
        name: next.site.name,
        slug: next.site.slug,
        description: next.site.description || '',
        spaFallback: next.site.spa_fallback,
        analyticsEnabled: next.site.analytics_enabled,
        indexingEnabled: next.site.indexing_enabled !== false,
        aiTextEnhancementEnabled: Boolean(next.site.ai_text_enhancement_enabled),
        strictSecurityMode: next.site.strict_security_mode,
        defaultDocument: next.site.default_document || 'index.html',
        custom404Behavior: next.site.custom_404_behavior || 'default',
      });
    } catch (error) {
      appToast(error instanceof Error ? error.message : 'The site could not be loaded.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [siteId]);

  const activeRelease = useMemo(
    () => detail?.releases.find((release) => release.id === detail.site.active_release_id) || null,
    [detail],
  );

  const rollback = async (release: WerseeSiteRelease) => {
    if (!detail || !await destructiveAction({
      title: `Restore release v${release.version}?`,
      description: 'Wersee will atomically move the public alias to this immutable deployment. No files are rebuilt.',
      confirmText: 'Restore release',
    })) return;
    setBusy(release.id);
    try {
      await sitesRequest(`/${detail.site.id}/releases/${release.id}/rollback`, { method: 'POST' });
      appToast(`Release v${release.version} is live again.`, 'success');
      await load(true);
    } catch (error) {
      appToast(error instanceof Error ? error.message : 'Rollback failed. The current release remains live.', 'error');
    } finally { setBusy(null); }
  };

  const removeRelease = async (release: WerseeSiteRelease) => {
    if (!detail || !await destructiveAction({
      title: `Remove release v${release.version}?`,
      description: release.status === 'published' ? 'Published history is retained as an archived release.' : 'Prepared files for this inactive release will be removed.',
      confirmText: release.status === 'published' ? 'Archive release' : 'Remove release',
    })) return;
    setBusy(release.id);
    try {
      await sitesRequest(`/${detail.site.id}/releases/${release.id}`, { method: 'DELETE' });
      appToast(release.status === 'published' ? 'Release archived.' : 'Release removed.', 'success');
      await load(true);
    } catch (error) { appToast(error instanceof Error ? error.message : 'The release could not be removed.', 'error'); }
    finally { setBusy(null); }
  };

  const saveSettings = async () => {
    if (!detail) return;
    setBusy('settings');
    try {
      const { site } = await sitesRequest<{ site: WerseeSite }>(`/${detail.site.id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setDetail({ ...detail, site });
      appToast('Site settings updated.', 'success');
    } catch (error) { appToast(error instanceof Error ? error.message : 'The settings could not be saved.', 'error'); }
    finally { setBusy(null); }
  };

  const deleteSite = async () => {
    if (!detail || !await destructiveAction({
      title: `Delete ${detail.site.name}?`,
      description: 'The public subdomain will be disconnected first. Deployment history is retained for audit purposes and the site is then archived.',
      confirmText: 'Delete site',
    })) return;
    setBusy('delete');
    try {
      await sitesRequest(`/${detail.site.id}`, { method: 'DELETE' });
      appToast('Site deleted and subdomain released.', 'success');
      onDeleted();
    } catch (error) { appToast(error instanceof Error ? error.message : 'The site could not be deleted.', 'error'); }
    finally { setBusy(null); }
  };

  if (loading || !detail) return <div className="flex h-full min-h-96 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-400" /></div>;

  const { site, releases, audit } = detail;
  const tabs: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'deployments', label: 'Deployments', icon: Rocket },
    ...(site.site_type === 'wersee_builder' ? [{ id: 'builder' as Tab, label: 'Builder', icon: Code2 }] : []),
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

  return (
    <div className="min-h-full bg-[#0a0a0a] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-white/45 hover:text-white"><ArrowLeft className="h-4 w-4" /> All sites</button>
        <header className="flex flex-col gap-5 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[.06] to-transparent p-5 md:flex-row md:items-center md:p-7">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">{site.icon_url ? <img src={site.icon_url} alt="" className="h-full w-full object-cover" /> : <Globe2 className="h-6 w-6 text-indigo-300" />}</div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-2xl font-black md:text-3xl">{site.name}</h1><span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${statusStyle(site.current_job?.status || site.status)}`}>{site.current_job?.stage || site.status}</span></div><a href={site.public_url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1.5 truncate text-sm text-indigo-300 hover:underline">{site.public_url}<ExternalLink className="h-3.5 w-3.5" /></a></div>
          </div>
          <div className="flex flex-wrap gap-2"><button onClick={() => navigator.clipboard.writeText(site.public_url).then(() => appToast('Public link copied.', 'success'))} className="rounded-xl border border-white/10 p-3 text-white/60 hover:bg-white/10" aria-label="Copy public URL"><Copy className="h-4 w-4" /></button><button onClick={() => onAnalytics(site.id)} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold hover:bg-white/10">Analytics</button><button onClick={() => onUpload(site)} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-black"><UploadCloud className="h-4 w-4" /> New version</button></div>
        </header>

        <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[.03] p-1.5">{tabs.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setTab(item.id)} className={`flex min-w-max items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${tab === item.id ? 'bg-white text-black' : 'text-white/45 hover:text-white'}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</nav>

        {tab === 'overview' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">{[
              ['Active release', activeRelease ? `v${activeRelease.version}` : 'Not published'],
              ['Published files', activeRelease?.file_count?.toLocaleString() || '0'],
              ['Published size', bytes(activeRelease?.total_bytes || 0)],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><p className="text-xs text-white/35">{label}</p><p className="mt-2 text-xl font-black">{value}</p></div>)}</div>
            <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[.05] p-5"><div className="flex items-center gap-2"><SearchCheck className="h-4 w-4 text-emerald-300" /><p className="text-sm font-bold">Search discovery</p></div><p className="mt-2 text-xs text-white/40">{site.indexing_enabled === false ? 'Disabled' : site.indexing_status === 'submitted' ? 'Latest release submitted through IndexNow' : site.indexing_status === 'failed' ? 'Last discovery request failed; sitemap remains available' : 'Will run after the next publication'}</p></div><div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-500/[.05] p-5"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-fuchsia-300" /><p className="text-sm font-bold">AI text guard</p></div><p className="mt-2 text-xs text-white/40">{site.ai_text_enhancement_enabled ? 'Enabled for new releases; only visible text can change' : 'Disabled for new releases'}</p></div></div>
            <section className="rounded-3xl border border-white/10 bg-white/[.03] p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">Current publication</h2><p className="mt-1 text-xs text-white/35">The public alias only changes after readiness checks pass.</p></div><ShieldCheck className="h-5 w-5 text-emerald-400" /></div>{activeRelease ? <div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-white/35">Release</p><p className="mt-1 font-bold">Version {activeRelease.version}</p></div><div><p className="text-xs text-white/35">Published</p><p className="mt-1 font-bold">{relativeTime(activeRelease.published_at)}</p></div><div className="sm:col-span-2"><p className="text-xs text-white/35">Deployment ID</p><p className="mt-1 break-all font-mono text-xs text-white/70">{activeRelease.vercel_deployment_id || 'Pending'}</p></div></div> : <div className="rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-100">Upload and publish the first immutable release to make this site live.</div>}</section>
          </div>
          <section className="rounded-3xl border border-white/10 bg-white/[.03] p-5 md:p-6"><h2 className="font-bold">Recent activity</h2><div className="mt-5 space-y-4">{audit.slice(0, 8).map((item) => <div key={item.id} className="flex gap-3"><div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400" /><div className="min-w-0"><p className="text-sm font-medium capitalize text-white/75">{item.action.replaceAll('_', ' ')}</p><p className="mt-1 text-xs text-white/30">{relativeTime(item.occurred_at)}</p></div></div>)}{!audit.length && <p className="text-sm text-white/35">No site activity yet.</p>}</div></section>
        </motion.div>}

        {tab === 'deployments' && <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.03]"><div className="flex items-center justify-between border-b border-white/10 p-5 md:p-6"><div><h2 className="font-bold">Immutable release history</h2><p className="mt-1 text-xs text-white/35">Rollbacks repoint the alias and never rebuild old files.</p></div><button onClick={() => void load(true)} className="rounded-xl p-2 text-white/45 hover:bg-white/10" aria-label="Refresh deployments"><RefreshCw className="h-4 w-4" /></button></div><div className="divide-y divide-white/5">{releases.map((release) => { const active = release.id === site.active_release_id; return <div key={release.id} className="grid gap-4 p-5 md:grid-cols-[auto_1fr_auto] md:items-center"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-white/40'}`}>{active ? <CheckCircle2 className="h-5 w-5" /> : <FileArchive className="h-5 w-5" />}</div><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">Release v{release.version}</p>{active && <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">Live</span>}<span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyle(release.status)}`}>{release.status}</span></div><p className="mt-1 text-xs text-white/35">{relativeTime(release.published_at || release.created_at)} - {release.file_count || 0} files - {bytes(release.total_bytes || 0)}</p>{release.notes && <p className="mt-2 text-sm text-white/55">{release.notes}</p>}</div><div className="flex gap-2">{release.status === 'published' && !active && <button disabled={busy === release.id} onClick={() => void rollback(release)} className="flex items-center gap-2 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-200 disabled:opacity-40">{busy === release.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Restore</button>}{!active && <button disabled={busy === release.id} onClick={() => void removeRelease(release)} className="rounded-xl border border-white/10 p-2 text-white/35 hover:text-red-300" aria-label={`Remove release ${release.version}`}><Trash2 className="h-4 w-4" /></button>}<button className="rounded-xl border border-white/10 p-2 text-white/25" aria-label="Release options"><MoreHorizontal className="h-4 w-4" /></button></div></div>; })}{!releases.length && <div className="p-12 text-center text-sm text-white/35">No releases have been created yet.</div>}</div></motion.section>}

        {tab === 'builder' && site.site_type === 'wersee_builder' && <div className="overflow-hidden rounded-3xl border border-white/10"><SiteEditorView businessIdOverride={site.business_id} embedded /></div>}

        {tab === 'settings' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="space-y-5 rounded-3xl border border-white/10 bg-white/[.03] p-5 md:p-7"><div><h2 className="font-bold">Site settings</h2><p className="mt-1 text-xs text-white/35">A subdomain change uses reserve, verify, alias swap and commit.</p></div><div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm text-white/50">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-indigo-500" /></label><label className="space-y-2 text-sm text-white/50">Subdomain<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-indigo-500" /></label><label className="space-y-2 text-sm text-white/50 md:col-span-2">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-24 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-indigo-500" /></label><label className="space-y-2 text-sm text-white/50">Default document<input value={form.defaultDocument} onChange={(event) => setForm({ ...form, defaultDocument: event.target.value })} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" /></label><label className="space-y-2 text-sm text-white/50">404 behavior<select value={form.custom404Behavior} onChange={(event) => setForm({ ...form, custom404Behavior: event.target.value })} className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-white outline-none"><option value="default">Default 404</option><option value="file">Serve 404.html</option><option value="spa">Use index.html</option></select></label></div><div className="grid gap-3 md:grid-cols-3">{[
            ['SPA fallback', 'spaFallback', 'Route unknown paths through index.html.'],
            ['Privacy analytics', 'analyticsEnabled', 'Inject the lightweight Wersee runtime.'],
            ['Strict security', 'strictSecurityMode', 'Apply hardened browser headers.'],
            ['Search discovery', 'indexingEnabled', 'Generate SEO files and submit changed URLs after publishing.'],
            ['AI text guard', 'aiTextEnhancementEnabled', 'Improve only visible copy in new releases; preserve code and structure.'],
          ].map(([label, key, description]) => <label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><input type="checkbox" className="mt-1" checked={Boolean(form[key as keyof typeof form])} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} /><span><span className="block text-sm font-bold">{label}</span><span className="mt-1 block text-xs leading-relaxed text-white/35">{description}</span></span></label>)}</div><div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/[.05] p-4"><p className="text-sm font-bold text-cyan-100">Advanced tracking through wersee.json</p><p className="mt-1 text-xs leading-relaxed text-white/40">A release can configure Web Vitals, scroll depth, form-submit counts and conversion goals. Wersee never collects field values. Custom goals use <code className="text-cyan-200">window.werseeAnalytics.track('goal')</code>.</p></div><div className="flex justify-end"><button disabled={busy === 'settings'} onClick={() => void saveSettings()} className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-black disabled:opacity-40">{busy === 'settings' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save settings</button></div></section>
          <aside className="h-fit rounded-3xl border border-red-500/15 bg-red-500/[.04] p-5"><h2 className="font-bold text-red-100">Danger zone</h2><p className="mt-2 text-xs leading-relaxed text-red-100/50">Deletion disconnects the alias before archiving this site. The active publication is never left accidentally reachable.</p><button disabled={busy === 'delete'} onClick={() => void deleteSite()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 disabled:opacity-40">{busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete site</button></aside>
        </motion.div>}
      </div>
    </div>
  );
};
