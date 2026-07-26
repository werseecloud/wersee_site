import React, { useMemo, useState } from 'react';
import {
  Activity, Archive, Bot, CheckCircle2, Clock3, Copy, Grid2X2, List, MoreHorizontal,
  Pause, Play, Plus, Search, Settings2, Sparkles, Trash2, Workflow as WorkflowIcon, XCircle,
} from 'lucide-react';
import type { WorkflowRecord, WorkflowRun } from './types';
import { formatDuration, formatRelativeTime } from './catalog';

interface Props {
  workflows: WorkflowRecord[];
  runs: WorkflowRun[];
  loading: boolean;
  onCreate: () => void;
  onOpen: (workflow: WorkflowRecord) => void;
  onTemplates: () => void;
  onConnections: () => void;
  onRun: (workflow: WorkflowRecord) => void;
  onStatus: (workflow: WorkflowRecord, status: 'active' | 'paused' | 'archived') => void;
  onDuplicate: (workflow: WorkflowRecord) => void;
  onExport: (workflow: WorkflowRecord) => void;
  onDelete: (workflow: WorkflowRecord) => void;
}

const statusStyles: Record<string, string> = {
  active: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  draft: 'border-white/10 bg-white/5 text-white/55',
  paused: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  disabled: 'border-white/10 bg-white/5 text-white/45',
  error: 'border-red-400/20 bg-red-400/10 text-red-300',
};

const WorkflowStatus = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusStyles[status] || statusStyles.draft}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    {status}
  </span>
);

export const WorkflowDashboard: React.FC<Props> = ({
  workflows, runs, loading, onCreate, onOpen, onTemplates, onConnections, onRun, onStatus, onDuplicate, onExport, onDelete,
}) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = useMemo(() => workflows.filter((workflow) => {
    const matchesQuery = `${workflow.name} ${workflow.description} ${workflow.trigger_type}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === 'all' || workflow.status === status);
  }), [workflows, query, status]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRuns = runs.filter((run) => new Date(run.created_at) >= today);
  const succeeded = runs.filter((run) => run.status === 'succeeded').length;
  const failed = runs.filter((run) => run.status === 'failed').length;
  const stats = [
    { label: 'Active workflows', value: workflows.filter((workflow) => workflow.status === 'active').length, icon: WorkflowIcon, color: 'text-violet-300 bg-violet-400/10' },
    { label: 'Runs today', value: todayRuns.length, icon: Activity, color: 'text-sky-300 bg-sky-400/10' },
    { label: 'Successful runs', value: succeeded, icon: CheckCircle2, color: 'text-emerald-300 bg-emerald-400/10' },
    { label: 'Failed runs', value: failed, icon: XCircle, color: 'text-red-300 bg-red-400/10' },
    { label: 'AI actions used', value: workflows.reduce((sum, workflow) => sum + Number(workflow.ai_actions_count || 0), 0), icon: Bot, color: 'text-fuchsia-300 bg-fuchsia-400/10' },
    { label: 'Estimated time saved', value: `${Math.round(runs.filter((run) => !run.test_mode && run.status === 'succeeded').length * 7 / 60)}h`, icon: Clock3, color: 'text-amber-300 bg-amber-400/10' },
  ];

  const actionMenu = (workflow: WorkflowRecord) => (
    <div className="absolute right-0 top-11 z-30 w-52 rounded-2xl border border-white/10 bg-[#181818] p-1.5 shadow-2xl" role="menu">
      <button onClick={() => { onOpen(workflow); setOpenMenu(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10 hover:text-white"><Settings2 className="h-4 w-4" /> Edit workflow</button>
      <button onClick={() => { onRun(workflow); setOpenMenu(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10 hover:text-white"><Play className="h-4 w-4" /> Run manually</button>
      <button onClick={() => { onDuplicate(workflow); setOpenMenu(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10 hover:text-white"><Copy className="h-4 w-4" /> Duplicate</button>
      <button onClick={() => { onExport(workflow); setOpenMenu(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10 hover:text-white"><Archive className="h-4 w-4" /> Export JSON</button>
      <div className="my-1 border-t border-white/10" />
      <button onClick={() => { onDelete(workflow); setOpenMenu(null); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /> Delete</button>
    </div>
  );

  if (!loading && workflows.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center py-10">
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#111] p-7 sm:p-12" style={{ backgroundImage: 'radial-gradient(circle at top left, rgba(124,58,237,.28), transparent 36%)' }}>
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-200"><Sparkles className="h-3.5 w-3.5" /> Wersee Workflows</span>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Automate your first task</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/55 sm:text-lg">Tell Wersee what you repeatedly do. Wersee AI will turn it into a workflow you can review, safely test and activate.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={onCreate} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-violet-100"><Sparkles className="h-4 w-4" /> Create with AI</button>
              <button onClick={onTemplates} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"><Grid2X2 className="h-4 w-4" /> Browse templates</button>
              <button onClick={onCreate} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white"><Plus className="h-4 w-4" /> Start manually</button>
            </div>
          </div>
          <div className="relative mt-10 grid gap-3 sm:grid-cols-3">
            {['Welcome customers after a purchase', 'Create a weekly sales summary', 'Notify me when a payment fails'].map((example) => (
              <button key={example} onClick={onCreate} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left text-sm leading-6 text-white/65 transition hover:border-violet-400/30 hover:bg-white/5 hover:text-white">{example}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 pb-10">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-300"><WorkflowIcon className="h-4 w-4" /> Intelligent automation</div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Workflows</h1>
          <p className="mt-2 text-sm text-white/45 sm:text-base">Automate your business with intelligent, connected workflows.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onTemplates} className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">Templates</button>
          <button onClick={onConnections} className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">Connections</button>
          <button onClick={onCreate} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-black hover:bg-violet-100"><Plus className="h-4 w-4" /> Create workflow</button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6" aria-label="Workflow statistics">
        {stats.map((stat) => <div key={stat.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
          <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
          <div className="text-2xl font-black text-white">{stat.value}</div>
          <div className="mt-1 text-xs text-white/40">{stat.label}</div>
        </div>)}
      </section>

      <section className="overflow-visible rounded-[28px] border border-white/[0.07] bg-[#111]">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <label className="relative max-w-md flex-1">
              <span className="sr-only">Search workflows</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search workflows..." className="h-11 w-full rounded-xl border border-white/10 bg-black/30 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-400/50" />
            </label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-[#181818] px-3 text-sm text-white/70 outline-none focus:border-violet-400/50">
              <option value="all">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="paused">Paused</option><option value="error">Error</option>
            </select>
          </div>
          <div className="flex rounded-xl border border-white/10 bg-black/20 p-1" aria-label="View">
            <button onClick={() => setView('grid')} aria-label="Grid view" className={`rounded-lg p-2 ${view === 'grid' ? 'bg-white/10 text-white' : 'text-white/35'}`}><Grid2X2 className="h-4 w-4" /></button>
            <button onClick={() => setView('table')} aria-label="Table view" className={`rounded-lg p-2 ${view === 'table' ? 'bg-white/10 text-white' : 'text-white/35'}`}><List className="h-4 w-4" /></button>
          </div>
        </div>

        {loading ? <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl bg-white/5" />)}</div>
          : view === 'grid' ? <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((workflow) => {
              const successRate = workflow.run_count ? Math.round((workflow.success_count / workflow.run_count) * 100) : 0;
              return <article key={workflow.id} className="group relative rounded-2xl border border-white/[0.07] bg-black/25 p-5 transition hover:-translate-y-0.5 hover:border-violet-400/25 hover:bg-white/[0.035]">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => onOpen(workflow)} className="flex min-w-0 items-center gap-3 text-left">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-violet-300"><WorkflowIcon className="h-5 w-5" /></span>
                    <span className="min-w-0"><span className="block truncate font-bold text-white">{workflow.name}</span><span className="mt-1 block truncate text-xs text-white/35">{workflow.draft_definition?.trigger?.label || workflow.trigger_type}</span></span>
                  </button>
                  <div className="relative"><button onClick={() => setOpenMenu(openMenu === workflow.id ? null : workflow.id)} aria-label={`Actions for ${workflow.name}`} className="rounded-xl p-2 text-white/35 hover:bg-white/10 hover:text-white"><MoreHorizontal className="h-5 w-5" /></button>{openMenu === workflow.id && actionMenu(workflow)}</div>
                </div>
                <p className="mt-5 line-clamp-2 min-h-10 text-sm leading-5 text-white/40">{workflow.description || workflow.draft_definition?.summary}</p>
                <div className="mt-5 flex items-center justify-between"><WorkflowStatus status={workflow.status} /><span className="text-xs text-white/30">Edited {formatRelativeTime(workflow.updated_at)}</span></div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-4 text-center"><div><div className="text-sm font-bold text-white">{workflow.run_count || 0}</div><div className="text-[10px] text-white/30">Runs</div></div><div><div className="text-sm font-bold text-white">{successRate}%</div><div className="text-[10px] text-white/30">Success</div></div><div><div className="text-sm font-bold text-white">{formatRelativeTime(workflow.last_run_at)}</div><div className="text-[10px] text-white/30">Last run</div></div></div>
                <div className="mt-4 flex gap-2"><button onClick={() => onRun(workflow)} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"><Play className="h-3.5 w-3.5" /> Run</button><button onClick={() => onStatus(workflow, workflow.status === 'active' ? 'paused' : 'active')} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white">{workflow.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{workflow.status === 'active' ? 'Pause' : 'Activate'}</button></div>
              </article>;
            })}
          </div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead><tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-white/30"><th className="px-5 py-4">Workflow</th><th>Status</th><th>Last run</th><th>Success rate</th><th>Average duration</th><th>Runs</th><th>Last edited</th><th className="pr-5" /></tr></thead><tbody>{filtered.map((workflow) => {
            const workflowRuns = runs.filter((run) => run.workflow_id === workflow.id);
            const durations = workflowRuns.filter((run) => run.duration_ms !== null).map((run) => run.duration_ms || 0);
            const average = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null;
            return <tr key={workflow.id} className="border-b border-white/[0.05] text-sm text-white/60 hover:bg-white/[0.025]"><td className="px-5 py-4"><button onClick={() => onOpen(workflow)} className="font-semibold text-white hover:text-violet-300">{workflow.name}</button><div className="mt-1 text-xs text-white/30">{workflow.draft_definition?.trigger?.label}</div></td><td><WorkflowStatus status={workflow.status} /></td><td>{formatRelativeTime(workflow.last_run_at)}</td><td>{workflow.run_count ? Math.round(workflow.success_count / workflow.run_count * 100) : 0}%</td><td>{formatDuration(average)}</td><td>{workflow.run_count}</td><td>{formatRelativeTime(workflow.updated_at)}</td><td className="relative pr-5 text-right"><button onClick={() => setOpenMenu(openMenu === workflow.id ? null : workflow.id)} className="rounded-lg p-2 hover:bg-white/10"><MoreHorizontal className="h-4 w-4" /></button>{openMenu === workflow.id && actionMenu(workflow)}</td></tr>;
          })}</tbody></table></div>}

        {!loading && filtered.length === 0 && <div className="p-14 text-center"><Search className="mx-auto h-8 w-8 text-white/20" /><h3 className="mt-4 font-bold text-white">No matching workflows</h3><p className="mt-1 text-sm text-white/35">Try another search or status.</p></div>}
      </section>
    </div>
  );
};
