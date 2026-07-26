import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity, ArrowUpRight, BarChart3, CheckCircle2, Copy, ExternalLink, FileArchive,
  Globe2, Loader2, Plus, RefreshCw, RotateCcw, Search, Settings2, Trash2, UploadCloud,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { appToast, destructiveAction } from '@/lib/feedback';
import {
  parseSitesOverviewResponse,
  sitesRequest,
  type SitesOverviewResponse,
  type WerseeSite,
} from '@/services/sitesService';
import { CreateSiteWizard } from './CreateSiteWizard';
import { SiteDetailView } from './SiteDetailView';

const bytes = (value = 0) => {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

const relative = (value?: string | null) => {
  if (!value) return 'Never';
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
};

const statusTone = (site: WerseeSite) => {
  const status = site.current_job?.status || site.status;
  if (status === 'published') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  if (status === 'failed') return 'bg-red-500/10 text-red-300 border-red-500/20';
  if (site.current_job) return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
  return 'bg-amber-500/10 text-amber-200 border-amber-500/20';
};

export const SitesView: React.FC<{ businessId?: string; onNavigate?: (view: string) => void }> = ({ businessId, onNavigate }) => {
  const [data, setData] = useState<SitesOverviewResponse>({ businesses: [], sites: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [businessFilter, setBusinessFilter] = useState(businessId || 'all');
  const [wizardSite, setWizardSite] = useState<WerseeSite | null | undefined>(undefined);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const response = await sitesRequest<unknown>('');
      setData(parseSitesOverviewResponse(response));
    }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Wersee Sites could not be loaded.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const sites = useMemo(() => data.sites.filter((site) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || site.name.toLowerCase().includes(needle) || site.slug.includes(needle) || site.business?.name?.toLowerCase().includes(needle);
    const matchesBusiness = businessFilter === 'all' || site.business_id === businessFilter || site.business?.slug === businessFilter;
    return matchesQuery && matchesBusiness;
  }), [data.sites, query, businessFilter]);

  const deleteSite = async (site: WerseeSite) => {
    if (!await destructiveAction({ title: `Delete ${site.name}?`, description: 'Wersee first disconnects the public alias, then archives the site and releases its subdomain.', confirmText: 'Delete site' })) return;
    try {
      await sitesRequest(`/${site.id}`, { method: 'DELETE' });
      appToast('Site deleted and subdomain released.', 'success');
      await load(true);
    } catch (deleteError) { appToast(deleteError instanceof Error ? deleteError.message : 'The site could not be deleted.', 'error'); }
  };

  const showAnalytics = (siteId: string) => {
    window.localStorage.setItem('wersee-sites-analytics-site', siteId);
    onNavigate?.('management-analytics');
  };

  const summaryCards: Array<{ label: string; value: string | number; icon: LucideIcon; tone: string }> = [
    { label: 'Total sites', value: data.sites.length, icon: Globe2, tone: 'text-indigo-300 bg-indigo-500/10' },
    { label: 'Live sites', value: data.sites.filter((site) => site.status === 'published').length, icon: CheckCircle2, tone: 'text-emerald-300 bg-emerald-500/10' },
    { label: 'Publishing now', value: data.sites.filter((site) => site.current_job).length, icon: Activity, tone: 'text-purple-300 bg-purple-500/10' },
    { label: 'Views, 7 days', value: data.sites.reduce((sum, site) => sum + Number(site.views_last_7_days || 0), 0).toLocaleString(), icon: BarChart3, tone: 'text-amber-300 bg-amber-500/10' },
  ];

  if (selectedSiteId) return <SiteDetailView siteId={selectedSiteId} onBack={() => { setSelectedSiteId(null); void load(true); }} onUpload={(site) => setWizardSite(site)} onDeleted={() => { setSelectedSiteId(null); void load(true); }} onAnalytics={showAnalytics} />;

  return (
    <div className="min-h-full overflow-y-auto bg-[#0a0a0a] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[.24em] text-indigo-400">Management</p><h1 className="mt-2 text-3xl font-black md:text-4xl">Sites</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">Upload, validate, preview and publish immutable static websites on a Wersee subdomain.</p></div>
          <button disabled={!data.businesses.length} onClick={() => setWizardSite(null)} className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-black shadow-xl disabled:opacity-40"><Plus className="h-4 w-4" /> Create site</button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{summaryCards.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs text-white/35">{label}</p></div>)}</section>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-3 sm:flex-row sm:items-center"><label className="relative flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sites, subdomains or businesses" className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-indigo-500" /></label><select value={businessFilter} onChange={(event) => setBusinessFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-sm text-white outline-none"><option value="all">All businesses</option>{data.businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select><button onClick={() => void load()} className="rounded-xl border border-white/10 p-3 text-white/45 hover:bg-white/10" aria-label="Refresh sites"><RefreshCw className="h-4 w-4" /></button></div>

        {loading ? <div className="flex min-h-80 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-400" /></div> : error ? <div className="rounded-3xl border border-red-500/20 bg-red-500/[.06] p-8 text-center"><p className="font-bold text-red-100">Sites could not be loaded</p><p className="mt-2 text-sm text-red-100/55">{error}</p><button onClick={() => void load()} className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black">Try again</button></div> : sites.length ? <div className="grid gap-4 xl:grid-cols-2">{sites.map((site, index) => <motion.article key={site.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .035, .2) }} className="group rounded-[26px] border border-white/10 bg-gradient-to-br from-white/[.055] to-transparent p-5 hover:border-white/20">
          <div className="flex items-start gap-4"><button onClick={() => setSelectedSiteId(site.id)} className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">{site.icon_url ? <img src={site.icon_url} alt="" className="h-full w-full object-cover" /> : <Globe2 className="h-6 w-6 text-indigo-300" />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><button onClick={() => setSelectedSiteId(site.id)} className="truncate text-left text-lg font-black hover:underline">{site.name}</button><span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${statusTone(site)}`}>{site.current_job?.stage || site.status}</span></div><p className="mt-1 truncate text-xs text-white/35">{site.business?.name || 'Wersee business'} - edited by {site.last_editor || 'Wersee user'}</p></div><a href={site.public_url} target="_blank" rel="noreferrer" className="rounded-xl p-2 text-white/35 hover:bg-white/10 hover:text-white" aria-label="Open site"><ExternalLink className="h-4 w-4" /></a></div>
          <button onClick={() => setSelectedSiteId(site.id)} className="mt-5 flex w-full items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-4 text-left"><div className="min-w-0"><p className="truncate text-sm font-bold text-indigo-300">{site.public_url}</p><p className="mt-1 text-xs text-white/30">Updated {relative(site.updated_at)}</p></div><ArrowUpRight className="h-4 w-4 text-white/30" /></button>
          {site.current_job && <div className="mt-4 rounded-2xl border border-indigo-500/15 bg-indigo-500/[.06] p-3"><div className="mb-2 flex justify-between text-xs text-indigo-100/65"><span className="capitalize">{site.current_job.stage}</span><span>{site.current_job.progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div animate={{ width: `${site.current_job.progress}%` }} className="h-full bg-indigo-400" /></div></div>}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-white/[.02] p-3 text-center"><div><p className="text-sm font-black">{Number(site.views_last_7_days || 0).toLocaleString()}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/25">Views</p></div><div className="border-x border-white/5"><p className="text-sm font-black">{site.active_release?.file_count || 0}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/25">Files</p></div><div><p className="text-sm font-black">{bytes(site.active_release?.total_bytes || 0)}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/25">Size</p></div></div>
          <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setWizardSite(site)} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/65 hover:bg-white/10"><UploadCloud className="h-3.5 w-3.5" /> Upload</button><button onClick={() => showAnalytics(site.id)} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/65 hover:bg-white/10"><BarChart3 className="h-3.5 w-3.5" /> Analytics</button><button onClick={() => setSelectedSiteId(site.id)} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/65 hover:bg-white/10"><RotateCcw className="h-3.5 w-3.5" /> Releases</button><button onClick={() => navigator.clipboard.writeText(site.public_url).then(() => appToast('Public link copied.', 'success'))} className="rounded-xl border border-white/10 p-2 text-white/40 hover:bg-white/10" aria-label="Copy public URL"><Copy className="h-3.5 w-3.5" /></button><button onClick={() => setSelectedSiteId(site.id)} className="rounded-xl border border-white/10 p-2 text-white/40 hover:bg-white/10" aria-label="Site settings"><Settings2 className="h-3.5 w-3.5" /></button><button onClick={() => void deleteSite(site)} className="ml-auto rounded-xl border border-red-500/10 p-2 text-red-300/50 hover:bg-red-500/10 hover:text-red-300" aria-label="Delete site"><Trash2 className="h-3.5 w-3.5" /></button></div>
        </motion.article>)}</div> : <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[.02] p-8 text-center"><div className="rounded-3xl bg-indigo-500/10 p-5"><FileArchive className="h-8 w-8 text-indigo-300" /></div><h2 className="mt-5 text-xl font-black">{data.sites.length ? 'No matching sites' : 'Publish your first static site'}</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-white/40">{data.sites.length ? 'Change the search or business filter.' : 'Upload a ZIP or folder, inspect the real validation report, preview it, then publish an immutable release.'}</p>{!data.sites.length && <button disabled={!data.businesses.length} onClick={() => setWizardSite(null)} className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-black text-black disabled:opacity-40"><Plus className="mr-2 inline h-4 w-4" /> Create site</button>}</div>}
      </div>

      <AnimatePresence>{wizardSite !== undefined && <CreateSiteWizard businesses={data.businesses} defaultSlug={data.username} existingSite={wizardSite} onClose={() => setWizardSite(undefined)} onComplete={() => { setWizardSite(undefined); void load(true); }} />}</AnimatePresence>
    </div>
  );
};
