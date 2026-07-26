import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity, BarChart3, CheckSquare2, Clock3, Download, Gauge, Loader2, MousePointerClick,
  RefreshCw, Route, Target, TriangleAlert, Users, Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { appToast } from '@/lib/feedback';
import {
  downloadSitesAnalyticsCsv,
  parseSitesOverviewResponse,
  sitesRequest,
  type WerseeSite,
} from '@/services/sitesService';

type Totals = {
  pageViews: number;
  sessions: number;
  uniqueVisitors: number;
  engagedSeconds: number;
  totalClicks: number;
  bounces: number;
  averageEngagedSeconds: number;
  bounceRate: number;
  sessionsPerVisitor: number | null;
  conversions: number;
  formSubmissions: number;
  errors: number;
};

type Summary = {
  current: Totals;
  previous: Totals;
  realtimeVisitors: number;
  recentActivity: Array<{ event_type: string; path?: string | null; element_label?: string | null; event_name?: string | null; metric_name?: string | null; metric_value?: number | null; country_code?: string | null; device_type?: string | null; received_at: string }>;
  releasePerformance: Array<Totals & { id?: string; version?: number; status?: string; published_at?: string | null }>;
  webVitals: Array<{ metricName: string; samples: number; average: number | null; minimum: number | null; maximum: number | null }>;
};

type Point = { date: string; pageViews: number; sessions: number; clicks: number; engagedSeconds: number };
type PageRow = { path: string; pageViews: number; entries: number; exits: number; engagedSeconds: number };
type DimensionRow = { value: string; count: number };
type RangePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa'];

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const rangeFor = (preset: RangePreset) => {
  const to = new Date();
  const from = new Date(to);
  if (preset === '7d') from.setUTCDate(from.getUTCDate() - 6);
  if (preset === '30d') from.setUTCDate(from.getUTCDate() - 29);
  if (preset === '90d') from.setUTCDate(from.getUTCDate() - 89);
  return { from: isoDate(from), to: isoDate(to) };
};

const duration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

const delta = (current: number, previous: number) => previous ? ((current - previous) / previous) * 100 : current ? 100 : 0;
const changeTone = (change: number) => change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-gray-400';

const MetricCard: React.FC<{ label: string; value: string; change?: number; icon: LucideIcon; tone: string }> = ({ label, value, change, icon: Icon, tone }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div>
    <div className="flex items-end justify-between gap-2"><p className="text-2xl font-black text-white">{value}</p>{change !== undefined && <span className={`text-xs font-bold ${changeTone(change)}`}>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>}</div>
    <p className="mt-1 text-xs text-white/35">{label}</p>
  </div>
);

const Breakdown: React.FC<{ title: string; values: DimensionRow[]; loading?: boolean }> = ({ title, values, loading }) => (
  <section className="rounded-3xl border border-white/10 bg-white/[.03] p-5">
    <h3 className="font-bold text-white">{title}</h3>
    <div className="mt-5 space-y-3">{loading ? <Loader2 className="h-5 w-5 animate-spin text-indigo-400" /> : values.slice(0, 7).map((item, index) => {
      const maximum = values[0]?.count || 1;
      return <div key={`${title}-${item.value}`}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate text-white/55">{item.value || 'Direct / unknown'}</span><span className="font-bold text-white">{item.count.toLocaleString()}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${(item.count / maximum) * 100}%`, backgroundColor: COLORS[index % COLORS.length] }} /></div></div>;
    })}{!loading && !values.length && <p className="text-sm text-white/30">No data in this range.</p>}</div>
  </section>
);

export const AnalyticsView: React.FC<{ fixedSiteId?: string }> = ({ fixedSiteId }) => {
  const [sites, setSites] = useState<WerseeSite[]>([]);
  const [siteId, setSiteId] = useState(fixedSiteId || window.localStorage.getItem('wersee-sites-analytics-site') || '');
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [range, setRange] = useState(rangeFor('30d'));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [dimensions, setDimensions] = useState<Record<string, DimensionRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    void sitesRequest<unknown>('').then((payload) => {
      const result = parseSitesOverviewResponse(payload);
      setSites(result.sites);
      setSiteId((current) => fixedSiteId || (result.sites.some((site) => site.id === current) ? current : result.sites[0]?.id || ''));
    }).catch((error) => appToast(error instanceof Error ? error.message : 'Sites could not be loaded.', 'error')).finally(() => setLoading(false));
  }, [fixedSiteId]);

  useEffect(() => {
    if (!siteId) return;
    window.localStorage.setItem('wersee-sites-analytics-site', siteId);
    setAnalyticsLoading(true);
    const params = `from=${range.from}&to=${range.to}`;
    const dimensionNames = ['referrer', 'country', 'device', 'browser', 'os', 'utm_campaign', 'outbound', 'download', 'goal', 'form', 'scroll_depth', 'error'];
    void Promise.all([
      sitesRequest<Summary>(`/${siteId}/analytics/summary?${params}`),
      sitesRequest<{ points: Point[] }>(`/${siteId}/analytics/timeseries?${params}`),
      sitesRequest<{ pages: PageRow[] }>(`/${siteId}/analytics/pages?${params}`),
      ...dimensionNames.map((name) => sitesRequest<{ values: DimensionRow[] }>(`/${siteId}/analytics/referrers?${params}&dimension=${name}`)),
    ]).then(([summaryResult, pointsResult, pagesResult, ...dimensionResults]) => {
      setSummary(summaryResult as Summary);
      setPoints((pointsResult as { points: Point[] }).points);
      setPages((pagesResult as { pages: PageRow[] }).pages);
      setDimensions(Object.fromEntries(dimensionNames.map((name, index) => [name, (dimensionResults[index] as { values: DimensionRow[] }).values])));
    }).catch((error) => appToast(error instanceof Error ? error.message : 'Analytics could not be loaded.', 'error')).finally(() => setAnalyticsLoading(false));
  }, [siteId, range.from, range.to]);

  const choosePreset = (next: RangePreset) => {
    setPreset(next);
    if (next !== 'custom') setRange(rangeFor(next));
  };

  const chartPoints = useMemo(() => points.map((point) => ({ ...point, label: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${point.date}T12:00:00Z`)) })), [points]);
  const current = summary?.current;
  const previous = summary?.previous;
  if (loading) return <div className="flex min-h-96 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-400" /></div>;

  if (!sites.length) return <div className="flex min-h-96 flex-col items-center justify-center p-8 text-center text-white"><BarChart3 className="h-10 w-10 text-indigo-300" /><h2 className="mt-5 text-xl font-black">No Sites analytics yet</h2><p className="mt-2 max-w-md text-sm text-white/40">Create a site first. Analytics is scoped per site and never exposes global platform data.</p></div>;

  return (
    <div className="min-h-full overflow-y-auto bg-[#0a0a0a] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[.24em] text-indigo-400">Wersee Sites</p><h1 className="mt-2 text-3xl font-black md:text-4xl">Analytics</h1><p className="mt-2 text-sm text-white/40">First-party, per-site measurement with consent-aware visitor counts.</p></div><div className="flex flex-col gap-2 sm:flex-row"><select value={siteId} onChange={(event) => setSiteId(event.target.value)} disabled={Boolean(fixedSiteId)} className="min-w-56 rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-sm font-bold text-white outline-none">{sites.map((site) => <option key={site.id} value={site.id}>{site.name} - {site.slug}</option>)}</select><button disabled={analyticsLoading} onClick={() => setRange({ ...range })} className="rounded-xl border border-white/10 p-3 text-white/45 hover:bg-white/10" aria-label="Refresh analytics"><RefreshCw className={`h-4 w-4 ${analyticsLoading ? 'animate-spin' : ''}`} /></button><button onClick={() => void downloadSitesAnalyticsCsv(siteId, range.from, range.to).catch((error) => appToast(error instanceof Error ? error.message : 'Export failed.', 'error'))} className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-black"><Download className="h-4 w-4" /> Export CSV</button></div></header>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-3 md:flex-row md:items-center"><div className="flex flex-1 gap-1 overflow-x-auto">{(['today', '7d', '30d', '90d', 'custom'] as RangePreset[]).map((item) => <button key={item} onClick={() => choosePreset(item)} className={`min-w-max rounded-xl px-3.5 py-2.5 text-xs font-bold ${preset === item ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>{item === 'today' ? 'Today' : item === 'custom' ? 'Custom' : item.toUpperCase()}</button>)}</div>{preset === 'custom' && <div className="flex items-center gap-2"><input type="date" value={range.from} max={range.to} onChange={(event) => setRange({ ...range, from: event.target.value })} className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs text-white" /><span className="text-white/25">to</span><input type="date" value={range.to} min={range.from} max={isoDate(new Date())} onChange={(event) => setRange({ ...range, to: event.target.value })} className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs text-white" /></div>}<div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300"><Wifi className="h-3.5 w-3.5" /> {summary?.realtimeVisitors || 0} realtime</div></div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{current && previous ? <>
          <MetricCard label="Page views" value={current.pageViews.toLocaleString()} change={delta(current.pageViews, previous.pageViews)} icon={BarChart3} tone="bg-indigo-500/10 text-indigo-300" />
          <MetricCard label="Sessions" value={current.sessions.toLocaleString()} change={delta(current.sessions, previous.sessions)} icon={Activity} tone="bg-purple-500/10 text-purple-300" />
          <MetricCard label="Consented visitors" value={current.uniqueVisitors.toLocaleString()} change={delta(current.uniqueVisitors, previous.uniqueVisitors)} icon={Users} tone="bg-emerald-500/10 text-emerald-300" />
          <MetricCard label="Average engaged time" value={duration(current.averageEngagedSeconds)} change={delta(current.averageEngagedSeconds, previous.averageEngagedSeconds)} icon={Clock3} tone="bg-amber-500/10 text-amber-300" />
          <MetricCard label="Bounce rate" value={`${current.bounceRate}%`} change={delta(current.bounceRate, previous.bounceRate)} icon={Route} tone="bg-rose-500/10 text-rose-300" />
          <MetricCard label="Tracked clicks" value={current.totalClicks.toLocaleString()} change={delta(current.totalClicks, previous.totalClicks)} icon={MousePointerClick} tone="bg-blue-500/10 text-blue-300" />
          <MetricCard label="Conversions" value={current.conversions.toLocaleString()} change={delta(current.conversions, previous.conversions)} icon={Target} tone="bg-fuchsia-500/10 text-fuchsia-300" />
          <MetricCard label="Form submissions" value={current.formSubmissions.toLocaleString()} change={delta(current.formSubmissions, previous.formSubmissions)} icon={CheckSquare2} tone="bg-cyan-500/10 text-cyan-300" />
          <MetricCard label="Client error signals" value={current.errors.toLocaleString()} change={delta(current.errors, previous.errors)} icon={TriangleAlert} tone="bg-red-500/10 text-red-300" />
          <MetricCard label="Sessions per visitor" value={current.sessionsPerVisitor?.toFixed(2) || 'Consent required'} icon={Users} tone="bg-cyan-500/10 text-cyan-300" />
        </> : Array.from({ length: 10 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl border border-white/5 bg-white/[.03]" />)}</section>

        <section className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/[.07] to-transparent p-5 md:p-6"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-cyan-400/10 p-2"><Gauge className="h-5 w-5 text-cyan-300" /></div><div><h2 className="font-bold">Real-user Web Vitals</h2><p className="mt-1 text-xs text-white/35">Aggregated browser performance from wersee.json; no page content or form values are stored.</p></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{['LCP', 'CLS', 'INP', 'FCP', 'TTFB'].map((metricName) => { const metric = summary?.webVitals.find((item) => item.metricName === metricName); const suffix = metricName === 'CLS' ? '' : ' ms'; return <div key={metricName} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs font-black text-cyan-200">{metricName}</p><p className="mt-2 text-xl font-black">{metric?.average == null ? '—' : `${metric.average}${suffix}`}</p><p className="mt-1 text-[10px] text-white/30">{metric?.samples || 0} samples</p></div>; })}</div></section>

        <section className="rounded-3xl border border-white/10 bg-white/[.03] p-5 md:p-6"><div className="mb-5"><h2 className="font-bold">Traffic over time</h2><p className="mt-1 text-xs text-white/35">Page views and sessions from server-aggregated daily events.</p></div><div className="h-80">{analyticsLoading ? <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartPoints}><defs><linearGradient id="views" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity={.45} /><stop offset="100%" stopColor="#818cf8" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,.3)', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,.3)', fontSize: 11 }} width={38} /><Tooltip contentStyle={{ background: '#151515', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12 }} /><Area type="monotone" dataKey="pageViews" stroke="#818cf8" strokeWidth={2} fill="url(#views)" /><Area type="monotone" dataKey="sessions" stroke="#34d399" strokeWidth={2} fill="transparent" /></AreaChart></ResponsiveContainer>}</div></section>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.03]"><div className="border-b border-white/10 p-5"><h2 className="font-bold">Top pages</h2><p className="mt-1 text-xs text-white/35">Entries, exits and engagement are collected without reading sensitive query values.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="text-xs text-white/30"><tr><th className="px-5 py-3 font-medium">Path</th><th className="px-4 py-3 font-medium">Views</th><th className="px-4 py-3 font-medium">Entries</th><th className="px-4 py-3 font-medium">Exits</th><th className="px-4 py-3 font-medium">Engaged</th></tr></thead><tbody className="divide-y divide-white/5">{pages.slice(0, 15).map((page) => <tr key={page.path}><td className="max-w-72 truncate px-5 py-3 font-medium text-white/75">{page.path}</td><td className="px-4 py-3 text-white/55">{page.pageViews}</td><td className="px-4 py-3 text-white/55">{page.entries}</td><td className="px-4 py-3 text-white/55">{page.exits}</td><td className="px-4 py-3 text-white/55">{duration(page.engagedSeconds)}</td></tr>)}{!pages.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-white/30">No page activity in this range.</td></tr>}</tbody></table></div></section><section className="rounded-3xl border border-white/10 bg-white/[.03] p-5"><h2 className="font-bold">Device mix</h2><div className="mt-5 h-56">{dimensions.device?.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dimensions.device.slice(0, 6)} dataKey="count" nameKey="value" innerRadius={54} outerRadius={82} paddingAngle={3}>{dimensions.device.slice(0, 6).map((item, index) => <Cell key={item.value} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: '#151515', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12 }} /></PieChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-white/30">No device data.</div>}</div><div className="space-y-2">{(dimensions.device || []).slice(0, 6).map((item, index) => <div key={item.value} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-white/45"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{item.value}</span><span className="font-bold">{item.count}</span></div>)}</div></section></div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Breakdown title="Conversion goals" values={dimensions.goal || []} loading={analyticsLoading} /><Breakdown title="Forms" values={dimensions.form || []} loading={analyticsLoading} /><Breakdown title="Scroll depth" values={dimensions.scroll_depth || []} loading={analyticsLoading} /><Breakdown title="Error signals" values={dimensions.error || []} loading={analyticsLoading} /><Breakdown title="Referrers" values={dimensions.referrer || []} loading={analyticsLoading} /><Breakdown title="Countries" values={dimensions.country || []} loading={analyticsLoading} /><Breakdown title="Browsers" values={dimensions.browser || []} loading={analyticsLoading} /><Breakdown title="Operating systems" values={dimensions.os || []} loading={analyticsLoading} /><Breakdown title="UTM campaigns" values={dimensions.utm_campaign || []} loading={analyticsLoading} /><Breakdown title="Outbound links" values={dimensions.outbound || []} loading={analyticsLoading} /><Breakdown title="Downloads" values={dimensions.download || []} loading={analyticsLoading} /><section className="rounded-3xl border border-white/10 bg-white/[.03] p-5"><h3 className="font-bold">Recent activity</h3><div className="mt-5 space-y-3">{summary?.recentActivity.slice(0, 7).map((event, index) => <div key={`${event.received_at}-${index}`} className="flex items-start gap-3"><div className="mt-1.5 h-2 w-2 rounded-full bg-indigo-400" /><div className="min-w-0"><p className="truncate text-xs font-bold capitalize text-white/65">{event.event_type.replaceAll('_', ' ')} {event.event_name || event.path || event.element_label || event.metric_name || ''}</p><p className="mt-1 text-[10px] text-white/25">{new Date(event.received_at).toLocaleString()}</p></div></div>)}{!summary?.recentActivity.length && <p className="text-sm text-white/30">No recent events.</p>}</div></section></section>

        <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-3xl border border-white/10 bg-white/[.03] p-5"><div className="mb-5"><h2 className="font-bold">Performance by release</h2><p className="mt-1 text-xs text-white/35">Compare immutable versions in the selected period.</p></div><div className="space-y-3">{summary?.releasePerformance.map((release) => <div key={release.id || 'builder'} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-4"><div><p className="text-sm font-bold">{release.version ? `Release v${release.version}` : 'Wersee Builder'}</p><p className="mt-1 text-xs capitalize text-white/30">{release.status || 'published'}</p></div><div className="text-right"><p className="text-sm font-black">{release.pageViews.toLocaleString()}</p><p className="text-[10px] uppercase tracking-wider text-white/25">Views</p></div><div className="text-right"><p className="text-sm font-black">{release.sessions.toLocaleString()}</p><p className="text-[10px] uppercase tracking-wider text-white/25">Sessions</p></div></div>)}{!summary?.releasePerformance.length && <p className="py-8 text-center text-sm text-white/30">No release activity in this range.</p>}</div></section><section className="rounded-3xl border border-white/10 bg-white/[.03] p-5"><div className="mb-5"><h2 className="font-bold">Campaign comparison</h2><p className="mt-1 text-xs text-white/35">Top UTM campaigns in the selected period.</p></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={(dimensions.utm_campaign || []).slice(0, 10)} layout="vertical"><CartesianGrid stroke="rgba(255,255,255,.06)" horizontal={false} /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,.3)', fontSize: 11 }} /><YAxis type="category" dataKey="value" width={100} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#151515', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12 }} /><Bar dataKey="count" fill="#818cf8" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div></section></div>
      </div>
    </div>
  );
};
